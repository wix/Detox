const AndroidDriver = require('../AndroidDriver');
const GenyCloudDeviceAllocator = require('./GenyCloudDeviceAllocator');
const GenyDeviceRegistryFactory = require('./GenyDeviceRegistryFactory');
const GenyCloudExec = require('./exec/GenyCloudExec');
const RecipesService = require('./services/GenyRecipesService');
const InstanceLookupService = require('./services/GenyInstanceLookupService');
const InstanceLifecycleService = require('./services/GenyInstanceLifecycleService');
const InstanceNaming = require('./services/GenyInstanceNaming');
const AuthService = require('./services/GenyAuthService');
const DeviceQueryHelper = require('./helpers/GenyDeviceQueryHelper');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const logger = require('../../../../utils/logger').child({ __filename });
const environment = require('../../../../utils/environment');

class GenyCloudDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unspecified Genymotion Cloud Emulator';

    const exec = new GenyCloudExec(environment.getGmsaasPath());
    const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)
    this._deviceRegistry = GenyDeviceRegistryFactory.forRuntime();
    this._deviceCleanupRegistry = GenyDeviceRegistryFactory.forGlobalShutdown();

    const recipeService = new RecipesService(exec, logger);
    const instanceLookupService = new InstanceLookupService(exec, instanceNaming, this._deviceRegistry);
    this._instanceLifecycleService = new InstanceLifecycleService(exec, instanceNaming);
    this._deviceQueryHelper = new DeviceQueryHelper(recipeService);
    this._deviceAllocator = new GenyCloudDeviceAllocator(this._deviceRegistry, this._deviceCleanupRegistry, instanceLookupService, this._instanceLifecycleService);

    this._authService = new AuthService(exec);
  }

  get name() {
    return this._name;
  }

  async prepare() {
    return this._validateGmsaasAuth();
  }

  async acquireFreeDevice(deviceQuery) {
    const recipe = await this._deviceQueryHelper.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    const { instance, isNew } = await this._deviceAllocator.allocateDevice(recipe);
    const { adbName, uuid } = instance;

    await this.emitter.emit('bootDevice', { coldBoot: isNew, deviceId: adbName, type: recipe.name});
    await this.adb.apiLevel(adbName);
    await this.adb.disableAndroidAnimations(adbName);

    this._name = `GenyCloud:${instance.name} (${uuid} ${adbName})`;
    return instance;
  }

  async installApp({ adbName }, _binaryPath, _testBinaryPath) {
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.appInstallHelper.install(adbName, binaryPath, testBinaryPath);
  }

  async cleanup(instance, bundleId) {
    await this._deviceRegistry.disposeDevice(instance.uuid);
    await super.cleanup(instance, bundleId);
  }

  async shutdown(instance) {
    await this.emitter.emit('beforeShutdownDevice', { deviceId: instance.adbName });
    await this._instanceLifecycleService.deleteInstance(instance.uuid);
    await this._deviceCleanupRegistry.disposeDevice(instance.uuid);
    await this.emitter.emit('shutdownDevice', { deviceId: instance.adbName });
  }

  _assertRecipe(deviceQuery, recipe) {
    if (!recipe) {
      throw new DetoxRuntimeError({
        message: 'No Genycloud devices found for recipe!',
        hint: `Check that your Genycloud account has a template associated with your Detox device configuration: ${JSON.stringify(deviceQuery)}\n`,
      });
    }
  }

  async _validateGmsaasAuth() {
    if (!await this._authService.getLoginEmail()) {
      throw new DetoxRuntimeError({
        message: 'Cannot run tests using a Genymotion-cloud emulator, because Genymotion was not logged-in to!',
        hint: `Log-in to Genymotion-cloud by running this command (and following instructions):\n${environment.getGmsaasPath()} auth login --help`,
      });
    }
  }

  static async globalCleanup() {
    const deviceCleanupRegistry = GenyDeviceRegistryFactory.forGlobalShutdown();
    const deviceUUIDs = await deviceCleanupRegistry.readRegisteredDevices();
    if (deviceUUIDs.length) {
      const exec = new GenyCloudExec(environment.getGmsaasPath());
      const instanceLifecycleService = new InstanceLifecycleService(exec, null);
      await doCleanup(instanceLifecycleService, deviceUUIDs);
    }
  }
}

const cleanupLogData = {
  event: 'GENYCLOUD_TEARDOWN',
};

async function doCleanup(instanceLifecycleService, deviceUUIDs) {
  logger.info(cleanupLogData, 'Initiating Genymotion cloud instances teardown...');

  const deletionLeaks = [];
  const killPromises = deviceUUIDs.map((uuid) =>
    instanceLifecycleService.deleteInstance(uuid)
      .catch((error) => deletionLeaks.push({ uuid, error })));

  await Promise.all(killPromises);
  reportGlobalCleanupSummary(deletionLeaks);
}

function reportGlobalCleanupSummary(deletionLeaks) {
  if (deletionLeaks.length) {
    logger.warn(cleanupLogData, 'WARNING! Detected a Genymotion cloud instance leakage, for the following instances:');

    deletionLeaks.forEach(({ uuid, error }) =>
      logger.warn(cleanupLogData, `Instance UUID ${uuid}: ${error}`));

    logger.info(cleanupLogData, 'Instances teardown completed with warnings');
  } else {
    logger.info(cleanupLogData, 'Instances teardown completed successfully');
  }
}

module.exports = GenyCloudDriver;
