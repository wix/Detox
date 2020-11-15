const ALLOCATE_DEVICE_LOG_EVT = 'ALLOCATE_DEVICE';

class AndroidDeviceAllocator {
  constructor(deviceRegistry, logger) {
    this.deviceRegistry = deviceRegistry;
    this.logger = logger;
  }

  async allocateDevice(deviceQuery) {
    this.logger.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Trying to allocate a device based on "${deviceQuery}"`);
    const deviceId = await this._doAllocateDevice(deviceQuery);
    this.logger.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Settled on ${deviceId}`);
    return deviceId;
  }

  async _doAllocateDevice(deviceQuery) {
    throw new Error('Not implemented!');
  }
}

module.exports = AndroidDeviceAllocator;
