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
    cookie.instance = undefined;
  }

  async _allocateDeviceSynchronized(recipe, cookie) {
    let instance = await this.instanceLookupService.findFreeInstance(recipe.uuid);
    if (!instance) {
      instance = await this.instanceLifecycleService.createInstance(recipe.uuid);
      cookie.isNew = true;
    }
    cookie.instance = instance;

    return instance.uuid;
  }

  async _postAllocateDevice(deviceQuery, deviceId, cookie) {
    let { instance, isNew } = cookie;

    if (isNew) {
      await this.deviceCleanupRegistry.allocateDevice(deviceId);
    }

    await super._postAllocateDevice(deviceQuery, {
      uuid: instance.uuid,
      toString: () => `GenyCloud:${instance.uuid}`,
    });

    instance = await this._waitForInstanceBoot(instance);
    instance = await this._adbConnectIfNeeded(instance);
    instance.toUniqueId = () => deviceId;
    return {
      instance,
      isNew,
    }
  }

  async _waitForInstanceBoot(instance) {
    if (instance.isOnline()) {
      return instance;
    }

    const instanceUUID = instance.uuid;
    const options = {
      backoff: 'none',
      retries: 18,
      interval: 10000,
    };

    return await retry(options, async () => {
      const instance = await this.instanceLookupService.getInstance(instanceUUID);
      if (!instance.isOnline()) {
        throw new Error(`Timeout waiting for instance ${instanceUUID} to be ready`);
      }
      return instance;
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
