const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');
const retry = require('../../../../utils/retry');
const logger = require('../../../../utils/logger').child({ __filename });

class GenyCloudDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, deviceCleanupRegistry, instanceLookupService, instanceLifecycleService) {
    super(deviceRegistry, logger);

    this.deviceCleanupRegistry = deviceCleanupRegistry;
    this.instanceLookupService = instanceLookupService;
    this.instanceLifecycleService = instanceLifecycleService;
  }

  async _doAllocateDevice(recipe) {
    let { instance, isNew } = await this._doSynchronizedAllocation(recipe);
    if (isNew) {
      await this.deviceCleanupRegistry.allocateDevice(instance.uuid);
    }

    instance = await this._waitForInstanceBoot(instance);
    instance = await this._adbConnectIfNeeded(instance);
    return {
      instance,
      isNew,
      toString: () => `GenyCloud:${instance.name} (${instance.uuid})`,
    }
  }

  async _doSynchronizedAllocation(recipe) {
    let instance = null;
    let isNew = false;

    await this.deviceRegistry.allocateDevice(async () => {
      instance = await this.instanceLookupService.findFreeInstance();
      if (!instance) {
        instance = await this.instanceLifecycleService.createInstance(recipe.uuid);
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
      const _instance = await this.instanceLookupService.getInstance(instance.uuid);
      if (!_instance.isOnline()) {
        throw new Error(`Timeout waiting for instance ${instance.uuid} to be ready`);
      }
      return _instance;
    });
  }

  async _adbConnectIfNeeded(instance) {
    if (!instance.isAdbConnected()) {
      instance = await this.instanceLifecycleService.adbConnectInstance(instance.uuid);
    }
    return instance;
  }
}

module.exports = GenyCloudDeviceAllocator;
