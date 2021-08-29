const { AllocationDriverBase, DeallocationDriverBase } = require('../../AllocationDriverBase');

const DetoxRuntimeError = require('../../../../../errors/DetoxRuntimeError');
const GenycloudEmulatorCookie = require('../../../../cookies/GenycloudEmulatorCookie');

class GenyAllocDriver extends AllocationDriverBase {

  /**
   * @param adb { ADB }
   * @param recipeQuerying { GenyRecipeQuerying }
   * @param instanceAllocation { GenyInstanceAllocation }
   * @param instanceLauncher { GenyInstanceLauncher }
   */
  constructor({ adb, recipeQuerying, instanceAllocation, instanceLauncher }) {
    super();
    this._adb = adb;
    this._recipeQuerying = recipeQuerying
    this._instanceAllocation = instanceAllocation;
    this._instanceLauncher = instanceLauncher;
  }

  /**
   * @param deviceQuery { Object | String }
   * @return {Promise<GenycloudEmulatorCookie>}
   */
  async allocate(deviceQuery) {
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    const allocResult = await this._instanceAllocation.allocateDevice(recipe);
    let { instance, isNew } = allocResult;

    try {
      instance = await this._instanceLauncher.launch(instance, isNew);
    } catch (e) {
      await this._instanceAllocation.deallocateDevice(instance.uuid);
      throw e;
    }
    const { adbName } = instance;

    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.apiLevel(adbName);
    return new GenycloudEmulatorCookie(instance);
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

class GenyDeallocDriver extends DeallocationDriverBase {
  constructor(instance, { instanceAllocation, instanceLauncher, }) {
    super();
    this._instance = instance;
    this._instanceAllocation = instanceAllocation;
    this._instanceLauncher = instanceLauncher;
  }

  /**
   * @param options { { shutdown: boolean } }
   * @return {Promise<void>}
   */
  async free(options = {}) {
    if (this._instance) {
      await this._instanceAllocation.deallocateDevice(this._instance.uuid);

      if (options.shutdown) {
        await this._instanceLauncher.shutdown(this._instance);
      }
    }
  }
}

module.exports = {
  GenyAllocDriver,
  GenyDeallocDriver,
};
