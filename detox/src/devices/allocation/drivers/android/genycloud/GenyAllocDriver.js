const { DetoxRuntimeError } = require('../../../../../errors');
const Timer = require('../../../../../utils/Timer');
const GenycloudEmulatorCookie = require('../../../../cookies/GenycloudEmulatorCookie');
const AllocationDriverBase = require('../../AllocationDriverBase');

class GenyAllocDriver extends AllocationDriverBase {

  /**
   * @param {object} options
   * @param {import('../../../../common/drivers/android/exec/ADB')} options.adb
   * @param {import('./GenyRecipeQuerying')} options.recipeQuerying
   * @param {import('./GenyInstanceAllocationHelper')} options.allocationHelper
   * @param {import('./GenyInstanceLauncher')} options.instanceLauncher
   */
  constructor({ adb, recipeQuerying, allocationHelper, instanceLauncher }) {
    super();

    this._adb = adb;
    this._recipeQuerying = recipeQuerying;
    this._instanceLauncher = instanceLauncher;
    this._instanceAllocationHelper = allocationHelper;
    this._launchInfo = {};
  }

  /**
   * @param deviceConfig { Object }
   * @return {Promise<GenycloudEmulatorCookie>}
   */
  async allocate(deviceConfig) {
    const deviceQuery = deviceConfig.device;
    const recipe = await this._recipeQuerying.getRecipeFromQuery(deviceQuery);
    this._assertRecipe(deviceQuery, recipe);

    const { instance, isNew } = await this._instanceAllocationHelper.allocateDevice(recipe);
    this._launchInfo[instance.uuid] = { isNew };
    return new GenycloudEmulatorCookie(instance);
  }

  /**
   * @param {GenycloudEmulatorCookie} cookie
   * @returns {Promise<void>}
   */
  async postAllocate(cookie) {
    const { instance } = cookie;
    const { isNew } = this._launchInfo[instance.uuid];
    const readyInstance = cookie.instance = await this._instanceLauncher.launch(instance, isNew);

    const { adbName } = readyInstance;
    await Timer.run(20000, 'waiting for device to respond', async () => {
      await this._adb.disableAndroidAnimations(adbName);
      await this._adb.setWiFiToggle(adbName, true);
      await this._adb.apiLevel(adbName);
    });
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
        hint: `Revisit your detox configuration. Genymotion templates list is available at: https://cloud.geny.io/recipes#custom`,
      });
    }
  }
}

module.exports = GenyAllocDriver;
