const { DetoxRuntimeError } = require('../../../../../errors');
const Timer = require('../../../../../utils/Timer');
const logger = require('../../../../../utils/logger').child({ cat: 'device' });
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
   * @param {import('./GenyInstanceLauncher')} options.instanceLauncher
   * @param {import('./services/GenyInstanceLifecycleService')} options.instanceLifecycleService
   * @param {import('./GenyRecipeQuerying')} options.recipeQuerying
   */
  constructor({
    adb,
    instanceLauncher,
    instanceLifecycleService,
    recipeQuerying
  }) {
    super();

    this._adb = adb;
    this._instanceLauncher = instanceLauncher;
    this._instanceLifecycleService = instanceLifecycleService;
    this._recipeQuerying = recipeQuerying;
    this._genyRegistry = new GenyRegistry();
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<GenycloudEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    const deviceQuery = deviceConfig.device;
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    let instance = this._genyRegistry.getFreeInstance(recipe);
    const isNew = !instance;
    if (isNew) {
      instance = await this._instanceLauncher.launch(recipe);
      this._genyRegistry.addInstance(instance);
    }

    try {
      const connectedInstance = await this._instanceLauncher.connect(instance);
      instance = this._genyRegistry.updateInstance(instance, connectedInstance);

      if (isNew) {
        await this._postCreate(instance);
      }

      return new GenycloudEmulatorCookie(instance);
    } catch (e) {
      try {
        await this.free(new GenycloudEmulatorCookie(instance), { shutdown: true });
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        throw e;
      }
    }
  }

  /**
   * @param {import('./services/dto/GenyInstance')} instance
   */
  async _postCreate(instance) {
    const { adbName } = instance;

    await Timer.run(20000, 'waiting for device to respond', async () => {
      await this._adb.disableAndroidAnimations(adbName);
      await this._adb.setWiFiToggle(adbName, true);
      await this._adb.apiLevel(adbName);
    });
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
      this._genyRegistry.freeInstance(cookie.instance);
    }
  }

  async cleanup() {
    logger.info(events.GENYCLOUD_TEARDOWN, 'Initiating Genymotion SaaS instances teardown...');

    const killPromises = this._genyRegistry.getInstances().map((instance) => {
      this._genyRegistry.busyInstance(instance, true);
      const onSuccess = () => this._genyRegistry.removeInstance(instance, true);
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
      logger.warn(events.GENYCLOUD_TEARDOWN, 'WARNING! Detected a Genymotion SaaS instance leakage, for the following instances:');

      deletionLeaks.forEach(({ uuid, name, error }) => {
        logger.warn(events.GENYCLOUD_TEARDOWN, [
          `Instance ${name} (${uuid})${error ? `: ${error}` : ''}`,
          `    Kill it by visiting https://cloud.geny.io/instance/${uuid}, or by running:`,
          `    gmsaas instances stop ${uuid}`,
        ].join('\n'));
      });

      logger.info(events.GENYCLOUD_TEARDOWN, 'Instances teardown completed with warnings');
    } else {
      logger.info(events.GENYCLOUD_TEARDOWN, 'Instances teardown completed successfully');
    }
  }
}


module.exports = GenyAllocDriver;
