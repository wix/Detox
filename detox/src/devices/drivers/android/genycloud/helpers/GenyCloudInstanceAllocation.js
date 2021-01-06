const AndroidDeviceAllocation = require('../../AndroidDeviceAllocation');
const GenyCloudInstanceHandle = require('../GenyCloudInstanceHandle');
const retry = require('../../../../../utils/retry');
const logger = require('../../../../../utils/logger').child({ __filename });

const { ALLOCATE_DEVICE_LOG_EVT } = AndroidDeviceAllocation;

class GenyCloudInstanceAllocation extends AndroidDeviceAllocation {
  constructor(deviceRegistry, deviceCleanupRegistry, instanceLookupService, instanceLifecycleService, eventEmitter) {
    super(deviceRegistry, eventEmitter, logger);

    this._deviceCleanupRegistry = deviceCleanupRegistry;
    this._instanceLookupService = instanceLookupService;
    this._instanceLifecycleService = instanceLifecycleService;
  }

  async allocateDevice(recipe) {
    this._logAllocationAttempt(recipe);
    let { instance, isNew } = await this._doSynchronizedAllocation(recipe);
    this._logAllocationResult(recipe, instance);

    if (isNew) {
      const instanceHandle = new GenyCloudInstanceHandle(instance);
      await this._deviceCleanupRegistry.allocateDevice(instanceHandle);
    }

    instance = await this._waitForInstanceBoot(instance);
    instance = await this._adbConnectIfNeeded(instance);

    await this._notifyAllocation(instance.adbName, recipe.name, isNew);
    return instance;
  }

  async deallocateDevice(instance) {
    const instanceHandle = new GenyCloudInstanceHandle(instance);

    await this._notifyPreDeallocation(instance.adbName);
    await this._instanceLifecycleService.deleteInstance(instance.uuid);
    await this._deviceCleanupRegistry.disposeDevice(instanceHandle);
    await this._notifyDeallocationCompleted(instance.adbName);
  }

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

    return {
      instance,
      isNew,
    }
  }

  async _waitForInstanceBoot(instance) {
    if (instance.isOnline()) {
      return instance;
    }

    const options = {
      backoff: 'none', // TODO apply reverse-linear polling
      retries: 18,
      interval: 10000,
    };

    return await retry(options, async () => {
      const _instance = await this._instanceLookupService.getInstance(instance.uuid);
      if (!_instance.isOnline()) {
        throw new Error(`Timeout waiting for instance ${instance.uuid} to be ready`);
      }
      return _instance;
    });
  }

  async _adbConnectIfNeeded(instance) {
    if (!instance.isAdbConnected()) {
      instance = await this._instanceLifecycleService.adbConnectInstance(instance.uuid);
    }
    return instance;
  }

  _logAllocationResult(deviceQuery, deviceHandle) {
    logger.info({ event: ALLOCATE_DEVICE_LOG_EVT }, `Allocating Genymotion-Cloud instance ${deviceHandle.name} for testing. To access it via a browser, go to: https://cloud.geny.io/app/instance/${deviceHandle.uuid}`);
  }
}

module.exports = GenyCloudInstanceAllocation;
