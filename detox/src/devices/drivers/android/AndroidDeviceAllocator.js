const log = require('../../../utils/logger').child({ __filename });

const ALLOCATE_DEVICE_LOG_EVT = 'ALLOCATE_DEVICE';

class AndroidDeviceAllocator {
  constructor(deviceRegistry) {
    this.deviceRegistry = deviceRegistry;
  }

  async allocateDevice(deviceQuery) {
    const cookie = {};
    await this._preAllocateDevice(deviceQuery, cookie);
    const deviceId = await this.deviceRegistry.allocateDevice(() => this._allocateDeviceSynchronized(deviceQuery, cookie));
    const deviceInfo = await this._postAllocateDevice(deviceQuery, deviceId, cookie) || deviceId;
    return deviceInfo;
  }

  /**
   * @protected
   * @return {Promise}
   */
  async _preAllocateDevice(deviceQuery, cookie) {
    log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Trying to allocate a device based on "${deviceQuery}"`);
  }

  /**
   * Allocate a device, returning a unique device name, on which inter-workers locking in device-registry
   * would be based.
   *
   * @protected
   * @return {Promise<string>} Unique device name (e.g. ADB-name) of a free matching device
   */
  async _allocateDeviceSynchronized(deviceQuery, cookie) {
    throw new Error('Not implemented!');
  }

  /**
   * @protected
   * @return {Promise}
   */
  async _postAllocateDevice(deviceQuery, deviceId, cookie) {
    log.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Settled on ${deviceId}`);
  }
}

module.exports = AndroidDeviceAllocator;
