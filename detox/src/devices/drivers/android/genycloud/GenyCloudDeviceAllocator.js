const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');
const retry = require('../../../../utils/retry');

class GenyCloudDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, instanceLookupService, instanceLifecycleService) {
    super(deviceRegistry);

    this.instanceLookupService = instanceLookupService;
    this.instanceLifecycleService = instanceLifecycleService;
  }

  async _preAllocateDevice(deviceQuery, cookie) {
    await super._preAllocateDevice(deviceQuery);

    cookie.created = false;
    cookie.instance = undefined;
  }

  async _allocateDeviceSynchronized(recipe, cookie) {
    let instance = await this.instanceLookupService.findFreeInstance(recipe.uuid);
    if (!instance) {
      instance = await this.instanceLifecycleService.createInstance(recipe.uuid);
      cookie.created = true;
    }
    cookie.instance = instance;

    return {
      uuid: instance.uuid,
      type: 'genycloud',
    };
  }

  async _postAllocateDevice(deviceQuery, deviceId, cookie) {
    let { instance, created } = cookie;

    await super._postAllocateDevice(deviceQuery, {
      ...deviceId,
      toString: () => `GenyCloud:${instance.uuid}`,
    });

    instance = await this._waitForInstanceBoot(instance);
    instance = await this._adbConnectIfNeeded(instance);
    instance.toUniqueId = () => deviceId;
    return {
      instance,
      created,
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
