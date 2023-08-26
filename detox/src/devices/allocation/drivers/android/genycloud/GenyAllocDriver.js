const { DetoxRuntimeError } = require('../../../../../errors');
const Timer = require('../../../../../utils/Timer');
const log = require('../../../../../utils/logger').child({ cat: 'device' });
const GenycloudEmulatorCookie = require('../../../../cookies/GenycloudEmulatorCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');

const GenyRegistry = require('./GenyRegistry');

const events = {
  GENYCLOUD_TEARDOWN: { event: 'GENYCLOUD_TEARDOWN' },
};

class GenyAllocDriver extends AllocationDriverBase {
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
    super();

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
    const deviceQuery = deviceConfig.device;
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    let instance = this._genyRegistry.findFreeInstance(recipe);
    if (!instance) {
      const instanceName = `Detox.${this._detoxSessionId}.${this._instanceCounter++}`;
      instance = await this._instanceLauncher.launch(recipe, instanceName);
      this._genyRegistry.addInstance(instance, recipe);
    }

    return new GenycloudEmulatorCookie(instance);
  }

  /**
   * @param {GenycloudEmulatorCookie} cookie
   */
  async postAllocate(cookie) {
    const instance = await this._instanceLauncher.connect(cookie.instance);
    this._genyRegistry.updateInstance(instance);

    if (this._genyRegistry.pollNewInstance(instance)) {
      const { adbName } = instance;

      await Timer.run(20000, 'waiting for device to respond', async () => {
        await this._adb.disableAndroidAnimations(adbName);
        await this._adb.setWiFiToggle(adbName, true);
        await this._adb.apiLevel(adbName);
      });
    }

    return new GenycloudEmulatorCookie(instance);
  }

  /**
   * @param cookie {GenycloudEmulatorCookie}
   * @param options {Partial<import('../../AllocationDriverBase').DeallocOptions>}
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    if (options.shutdown) {
      this._genyRegistry.removeInstance(cookie.instance);
      await this._instanceLauncher.shutdown(cookie.instance);
    } else {
      this._genyRegistry.markAsFree(cookie.instance);
    }
  }

  async cleanup() {
    log.info(events.GENYCLOUD_TEARDOWN, 'Initiating Genymotion SaaS instances teardown...');

    const killPromises = this._genyRegistry.getInstances().map((instance) => {
      this._genyRegistry.markAsBusy(instance);
      const onSuccess = () => this._genyRegistry.removeInstance(instance);
      const onError = (error) => ({ ...instance, error });
      return this._instanceLauncher.shutdown(instance).then(onSuccess, onError);
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
