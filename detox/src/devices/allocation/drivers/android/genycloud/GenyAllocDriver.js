const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const GenycloudEmulatorCookie = require('../../../../cookies/GenycloudEmulatorCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');

class GenyAllocDriver extends AllocationDriverBase {

  /**
   * @param adb { ADB }
   * @param recipeQuerying { GenyRecipeQuerying }
   * @param allocationHelper { GenyInstanceAllocationHelper }
   * @param instanceLauncher { GenyInstanceLauncher }
   */
  constructor({ adb, recipeQuerying, allocationHelper, instanceLauncher }) {
    super();
    this._adb = adb;
    this._recipeQuerying = recipeQuerying;
    this._instanceLauncher = instanceLauncher;
    this._instanceAllocationHelper = allocationHelper;
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<GenycloudEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    const deviceQuery = deviceConfig.device;
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    const allocResult = await this._instanceAllocationHelper.allocateDevice(recipe);
    let { instance, isNew } = allocResult;

    try {
      instance = await this._instanceLauncher.launch(instance, isNew);
    } catch (e) {
      await this._instanceAllocationHelper.deallocateDevice(instance.uuid);
      throw e;
    }
    const { adbName } = instance;

    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.apiLevel(adbName);
    return new GenycloudEmulatorCookie(instance);
  }

  /**
   * @param cookie { GenycloudEmulatorCookie }
   * @param options { DeallocOptions }
   * @return {Promise<void>}
   */
  async free(cookie, options = {}) {
    const { instance } = cookie;

    await this._instanceAllocationHelper.deallocateDevice(instance.uuid);

    if (options.shutdown) {
      await this._instanceLauncher.shutdown(instance);
    }
  }

  _assertRecipe(deviceQuery, recipe) {
    if (!recipe) {
      throw new DetoxRuntimeError({
        message: `No Genymotion-Cloud template found to match the configured lookup query: ${JSON.stringify(deviceQuery)}`,
        hint: `Revisit your detox configuration. Genymotion templates list is available at: https://cloud.geny.io/app/shared-devices`,
      });
    }
  }
}

module.exports = GenyAllocDriver;
