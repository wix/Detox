const semver = require('semver');

const AllocationDriverBase = require('../AllocationDriverBase');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const GenycloudEmulatorCookie = require('../../GenycloudEmulatorCookie');
const RecipesService = require('../../../drivers/android/genycloud/services/GenyRecipesService');
const RecipeQuerying = require('./GenyRecipeQuerying');
const InstanceLauncher = require('./GenyCloudInstanceLauncher');
const GenyCloudInstanceAllocation = require('./GenyCloudInstanceAllocation');
const InstanceLookupService = require('../../../drivers/android/genycloud/services/GenyInstanceLookupService');
const InstanceLifecycleService = require('../../../drivers/android/genycloud/services/GenyInstanceLifecycleService');
const AuthService = require('../../../drivers/android/genycloud/services/GenyAuthService');
const InstanceNaming = require('../../../drivers/android/genycloud/services/GenyInstanceNaming');
const GenyDeviceRegistryFactory = require('../../../drivers/android/genycloud/GenyDeviceRegistryFactory');

const logger = require('../../../../utils/logger').child({ __filename });

const MIN_GMSAAS_VERSION = '1.6.0';

class GenycloudAllocDriver extends AllocationDriverBase {
  /**
   * @param genycloudExec { GenyCloudExec }
   * @param eventEmitter { AsyncEmitter }
   */
  constructor({ genycloudExec, eventEmitter }) {
    super();

    // TODO ASDASD DI this (i.e. via factory)
    this._exec = genycloudExec; // TODO ASDASD should not be needed as a class member
    this._eventEmitter = eventEmitter; // TODO ASDASD should not be needed as a class member

    const instanceNaming = new InstanceNaming(); // TODO should consider a permissive impl for debug/dev mode. Maybe even a custom arg in package.json (Detox > ... > genycloud > sharedAccount: false)
    const deviceRegistry = GenyDeviceRegistryFactory.forRuntime();
    const deviceCleanupRegistry = GenyDeviceRegistryFactory.forGlobalShutdown();

    const recipeService = new RecipesService(genycloudExec, logger);
    const instanceLookupService = new InstanceLookupService(genycloudExec, instanceNaming, deviceRegistry);
    const instanceLifecycleService = new InstanceLifecycleService(genycloudExec, instanceNaming);
    this._recipeQuerying = new RecipeQuerying(recipeService);
    this._instanceAllocation = new GenyCloudInstanceAllocation({ deviceRegistry, instanceLookupService, instanceLifecycleService });
    this._instanceLauncher = new InstanceLauncher(this._instanceLifecycleService, deviceCleanupRegistry, eventEmitter);

    // this._authService = new AuthService(this._exec);
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

    await this._notifyBootEvent(instance.adbName, recipe.name, isNew);
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
