const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');
const retry = require('../../../../utils/retry');

class GenyCloudDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, deviceCleanupRegistry, instanceLookupService, instanceLifecycleService) {
    super(deviceRegistry);

    this.deviceCleanupRegistry = deviceCleanupRegistry;
    this.instanceLookupService = instanceLookupService;
    this.instanceLifecycleService = instanceLifecycleService;
  }

  async _preAllocateDevice(deviceQuery, cookie) {
    await super._preAllocateDevice(deviceQuery);
    cookie.isNew = false;
  }

  async _allocateDeviceSynchronized(recipe, cookie) {
    let instance = await this.instanceLookupService.findFreeInstance(recipe.uuid);
    if (!instance) {
      instance = await this.instanceLifecycleService.createInstance(recipe.uuid);
      cookie.isNew = true;
    }
    return instance;
  }

  async _postAllocateDevice(deviceQuery, instance, cookie) {
    let { isNew } = cookie;

    if (isNew) {
      await this.deviceCleanupRegistry.allocateDevice(instance.uuid);
    }

    await super._postAllocateDevice(deviceQuery, {
      uuid: instance.uuid,
      toString: () => `GenyCloud:${instance.uuid}`,
    });

    instance = await this._waitForInstanceBoot(instance);
    instance = await this._adbConnectIfNeeded(instance);
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
      backoff: 'none',
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
