const ALLOCATE_DEVICE_LOG_EVT = 'ALLOCATE_DEVICE';
// TODO ASDASD Turn this into a "DeviceAllocation" (used by iOS, as well?)
class AndroidDeviceAllocation {
  constructor(deviceRegistry, logger) {
    this._deviceRegistry = deviceRegistry;
    this._logger = logger;
  }

  _logAllocationAttempt(deviceQuery) {
    this._logger.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Trying to allocate a device based on "${deviceQuery}"`);
  }

  _logAllocationResult(deviceQuery, deviceHandle) {
    this._logger.debug({ event: ALLOCATE_DEVICE_LOG_EVT }, `Settled on ${deviceHandle}`);
  }
}

AndroidDeviceAllocation.ALLOCATE_DEVICE_LOG_EVT = ALLOCATE_DEVICE_LOG_EVT;

module.exports = AndroidDeviceAllocation;
