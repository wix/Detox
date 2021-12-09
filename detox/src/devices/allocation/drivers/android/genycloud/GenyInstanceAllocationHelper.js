const logger = require('../../../../../utils/logger').child({ __filename });
const DeviceAllocationHelper = require('../../../../common/drivers/DeviceAllocationHelper');

const { ALLOCATE_DEVICE_LOG_EVT } = DeviceAllocationHelper;

class AllocationResult {
  constructor(instance, isNew) {
    this.instance = instance;
    this.isNew = isNew;
  }
}

class GenyInstanceAllocationHelper extends DeviceAllocationHelper {
  constructor({ deviceRegistry, instanceLookupService, instanceLifecycleService }) {
    super(deviceRegistry, logger);

    this._instanceLookupService = instanceLookupService;
    this._instanceLifecycleService = instanceLifecycleService;
  }

  /**
   * @param recipe { GenyRecipe }
   * @return { Promise<AllocationResult> }
   */
  async allocateDevice(recipe) {
    this._logAllocationAttempt(recipe);

    const allocationResult = await this._doSynchronizedAllocation(recipe);
    this._logAllocationResult(recipe, allocationResult.instance);

    return allocationResult;
  }

  async deallocateDevice(instanceUUID) {
    await this._deviceRegistry.disposeDevice(instanceUUID);
  }

  /**
   * @param recipe { GenyRecipe }
   * @return {Promise<{AllocationResult}>}
   * @private
   */
  async _doSynchronizedAllocation(recipe) {
    let instance = null;
    let isNew = false;

    await this._deviceRegistry.allocateDevice(async () => {
      instance = await this._instanceLookupService.findFreeInstance();
      if (!instance) {
        instance = await this._instanceLifecycleService.createInstance(recipe.uuid);
        isNew = true;
      }
      return instance.uuid;
    });

    return new AllocationResult(instance, isNew);
  }

  _logAllocationResult(deviceQuery, deviceHandle) {
    logger.info({ event: ALLOCATE_DEVICE_LOG_EVT }, `Allocating Genymotion-Cloud instance ${deviceHandle.name} for testing. To access it via a browser, go to: https://cloud.geny.io/app/instance/${deviceHandle.uuid}`);
  }
}

module.exports = GenyInstanceAllocationHelper;
