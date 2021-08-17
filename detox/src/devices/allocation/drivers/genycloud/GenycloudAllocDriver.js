const semver = require('semver');

const AllocationDriverBase = require('../AllocationDriverBase');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const GenycloudEmulatorCookie = require('../../GenycloudEmulatorCookie');

const MIN_GMSAAS_VERSION = '1.6.0';

class GenycloudAllocDriver extends AllocationDriverBase {

  /**
   * @param adb { ADB }
   * @param eventEmitter { AsyncEmitter }
   * @param recipeQuerying { GenyRecipeQuerying }
   * @param instanceAllocation { GenyInstanceAllocation }
   * @param instanceLauncher { GenyInstanceLauncher }
   */
  constructor({ adb, eventEmitter, recipeQuerying, instanceAllocation, instanceLauncher }) {
    super(eventEmitter);
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
    // TODO ASDASD Find a more suitable place for this (factory?)
    // await this._validateGmsaasVersion();
    // await this._validateGmsaasAuth();

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

    await this._notifyBootEvent(adbName, recipe.name, isNew);

    await this._adb.disableAndroidAnimations(adbName);
    await this._adb.apiLevel(adbName);

    return new GenycloudEmulatorCookie(instance, recipe);
  }

  /**
   * @param deviceCookie { GenycloudEmulatorCookie }
   * @param options { { shutdown: boolean} }
   * @return {Promise<void>}
   */
  async free(deviceCookie, options = {}) {
    const { instance } = deviceCookie;
    if (instance) {
      await this._instanceAllocation.deallocateDevice(instance.uuid);

      if (options.shutdown) {
        await this._instanceLauncher.shutdown(instance);
      }
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

  async _validateGmsaasVersion() {
    const { version } = await this._exec.getVersion();
    if (semver.lt(version, MIN_GMSAAS_VERSION)) {
      throw new DetoxRuntimeError({
        message: `Your Genymotion-Cloud executable (found in ${environment.getGmsaasPath()}) is too old! (version ${version})`,
        hint: `Detox requires version 1.6.0, or newer. To use 'android.genycloud' type devices, you must upgrade it, first.`,
      });
    }
  }

  async _validateGmsaasAuth() {
    if (!await this._authService.getLoginEmail()) {
      throw new DetoxRuntimeError({
        message: `Cannot run tests using 'android.genycloud' type devices, because Genymotion was not logged-in to!`,
        hint: `Log-in to Genymotion-cloud by running this command (and following instructions):\n${environment.getGmsaasPath()} auth login --help`,
      });
    }
  }
}

module.exports = GenycloudAllocDriver;
