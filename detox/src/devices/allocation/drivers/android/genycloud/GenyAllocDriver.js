/**
 * @typedef {import('../../AllocationDriverBase').AllocationDriverBase} AllocationDriverBase
 * @typedef {import('../../../../common/drivers/android/cookies').GenycloudEmulatorCookie} GenycloudEmulatorCookie
 */

const { DetoxRuntimeError } = require('../../../../../errors');
const Timer = require('../../../../../utils/Timer');
const log = require('../../../../../utils/logger').child({ cat: 'device' });

const GenyRegistry = require('./GenyRegistry');

const events = {
  GENYCLOUD_TEARDOWN: { event: 'GENYCLOUD_TEARDOWN' },
};

/**
 * @implements {AllocationDriverBase}
 */
class GenyAllocDriver {
  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {DetoxInternals.SessionState} options.detoxSession
   * @param {import('./GenyRegistry')} options.genyRegistry
   * @param {import('./GenyInstanceLauncher')} options.instanceLauncher
   * @param {import('./GenyRecipeQuerying')} options.recipeQuerying
   */
  constructor({
    adb,
    detoxSession,
    genyRegistry = new GenyRegistry(),
    instanceLauncher,
    recipeQuerying,
  }) {
    this._adb = adb;
    this._detoxSessionId = detoxSession.id;
    this._genyRegistry = genyRegistry;
    this._instanceLauncher = instanceLauncher;
    this._recipeQuerying = recipeQuerying;
    this._instanceCounter = 0;
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<GenycloudEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const deviceQuery = deviceConfig.device;
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    let instance = this._genyRegistry.findFreeInstance(recipe);
    if (!instance) {
      const instanceName = `Detox.${this._detoxSessionId}.${this._instanceCounter++}`;
      instance = await this._instanceLauncher.launch(recipe, instanceName);
      this._genyRegistry.addInstance(instance, recipe);
    }

    return {
      id: instance.uuid,
      adbName: instance.adbName,
      name: instance.name,
      instance,
    };
  }

  /**
   * @param {GenycloudEmulatorCookie} cookie
   */
  async postAllocate(cookie) {
    const instance = await this._instanceLauncher.connect(cookie.instance);
    this._genyRegistry.updateInstance(instance);

    if (this._genyRegistry.pollNewInstance(instance.uuid)) {
      const { adbName } = instance;

      await Timer.run(20000, 'waiting for device to respond', async () => {
        await this._adb.disableAndroidAnimations(adbName);
        await this._adb.setWiFiToggle(adbName, true);
        await this._adb.apiLevel(adbName);
      });
    }

    return {
      ...cookie,
      adbName: instance.adbName,
    };
  }

  /**
   * @param cookie {Omit<GenycloudEmulatorCookie, 'instance'>}
   * @param options {Partial<import('../../AllocationDriverBase').DeallocOptions>}
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    // Known issue: cookie won't have a proper 'instance' field due to (de)serialization
    if (options.shutdown) {
      this._genyRegistry.removeInstance(cookie.id);
      await this._instanceLauncher.shutdown(cookie.id);
    } else {
      this._genyRegistry.markAsFree(cookie.id);
    }
  }

  async cleanup() {
    log.info(events.GENYCLOUD_TEARDOWN, 'Initiating Genymotion SaaS instances teardown...');

    const killPromises = this._genyRegistry.getInstances().map((instance) => {
      this._genyRegistry.markAsBusy(instance.uuid);
      const onSuccess = () => this._genyRegistry.removeInstance(instance.uuid);
      const onError = (error) => ({ ...instance, error });
      return this._instanceLauncher.shutdown(instance.uuid).then(onSuccess, onError);
    });

    const deletionLeaks = (await Promise.all(killPromises)).filter(Boolean);
    this._reportGlobalCleanupSummary(deletionLeaks);
  }

  emergencyCleanup() {
    const instances = this._genyRegistry.getInstances();
    this._reportGlobalCleanupSummary(instances);
  }

  _assertRecipe(deviceQuery, recipe) {
    if (!recipe) {
      throw new DetoxRuntimeError({
        message: `No Genymotion-Cloud template found to match the configured lookup query: ${JSON.stringify(deviceQuery)}`,
        hint: `Revisit your detox configuration. Genymotion templates list is available at: https://cloud.geny.io/recipes#custom`,
      });
    }
  }

  _reportGlobalCleanupSummary(deletionLeaks) {
    if (deletionLeaks.length) {
      log.warn(events.GENYCLOUD_TEARDOWN, 'WARNING! Detected a Genymotion SaaS instance leakage, for the following instances:');

      deletionLeaks.forEach(({ uuid, name, error }) => {
        log.warn(events.GENYCLOUD_TEARDOWN, [
          `Instance ${name} (${uuid})${error ? `: ${error}` : ''}`,
          `    Kill it by visiting https://cloud.geny.io/instance/${uuid}, or by running:`,
          `    gmsaas instances stop ${uuid}`,
        ].join('\n'));
      });

      log.info(events.GENYCLOUD_TEARDOWN, 'Instances teardown completed with warnings');
    } else {
      log.info(events.GENYCLOUD_TEARDOWN, 'Instances teardown completed successfully');
    }
  }
}

module.exports = GenyAllocDriver;
