const AndroidDriver = require('../AndroidDriver');
const GenyCloudDeviceAllocator = require('./GenyCloudDeviceAllocator');
const GenyCloudExec = require('./exec/GenyCloudExec');
const RecipesService = require('./services/GenyRecipesService');
const InstanceLookupService = require('./services/GenyInstanceLookupService');
const InstanceLifecycleService = require('./services/GenyInstanceLifecycleService');
const InstanceNaming = require('./services/GenyInstanceNaming');
const DeviceQueryHelper = require('./helpers/GenyDeviceQueryHelper');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const logger = require('../../../../utils/logger').child({ __filename });

class GenyCloudDriver extends AndroidDriver {
  constructor(config) {
    super(config);
    this._name = 'Unspecified Genymotion Cloud Emulator';

    const exec = new GenyCloudExec();
    const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)
    const recipeService = new RecipesService(exec, logger);
    const instanceLookupService = new InstanceLookupService(exec, instanceNaming, this.deviceRegistry);
    const instanceLifecycleService = new InstanceLifecycleService(exec, instanceNaming);
    this._deviceQueryHelper = new DeviceQueryHelper(recipeService);
    this._deviceAllocator = new GenyCloudDeviceAllocator(this.deviceRegistry, instanceLookupService, instanceLifecycleService);
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const recipe = await this._deviceQueryHelper.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    const { instance, created } = await this._deviceAllocator.allocateDevice(recipe);
    const { adbName, uuid } = instance;

    await this.emitter.emit('bootDevice', { coldBoot: created, deviceId: adbName, type: recipe.name});
    await this.adb.apiLevel(adbName);
    await this.adb.disableAndroidAnimations(adbName);

    this._name = `GenyCloud:${uuid} (${adbName})`;
    return instance;
  }

  async installApp({ adbName }, _binaryPath, _testBinaryPath) {
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.appInstallHelper.install(adbName, binaryPath, testBinaryPath);
  }

  async cleanup(deviceId, bundleId) {
    return super.cleanup(deviceId.toUniqueId(), bundleId);
  }

  _assertRecipe(deviceQuery, recipe) {
    if (!recipe) {
      throw new DetoxRuntimeError({
        message: 'No Genycloud devices found for recipe!',
        hint: `Check that your Genycloud account has a template associated with your Detox device configuration: ${JSON.stringify(deviceQuery)}\n`,
      });
    }
  }
}

module.exports = GenyCloudDriver;
