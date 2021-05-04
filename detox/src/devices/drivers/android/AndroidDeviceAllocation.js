const ALLOCATE_DEVICE_LOG_EVT = 'ALLOCATE_DEVICE';

class AndroidDeviceAllocation {
  constructor(deviceRegistry, eventEmitter, logger) {
    this._deviceRegistry = deviceRegistry;
    this._eventEmitter = eventEmitter;
    this._logger = logger;
  }

  _logAllocationAttempt(deviceQuery) {
    this._logger.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Trying to allocate a device based on "${deviceQuery}"`);
  }

  _logAllocationResult(deviceQuery, deviceHandle) {
    this._logger.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Settled on ${deviceHandle}`);
  }

  async _notifyAllocation(deviceId, type, isNew) {
    return this._eventEmitter.emit('bootDevice', { coldBoot: isNew, deviceId, type, });
  }
}

AndroidDeviceAllocation.ALLOCATE_DEVICE_LOG_EVT = ALLOCATE_DEVICE_LOG_EVT;

module.exports = AndroidDeviceAllocation;
