const log = require('../../../../utils/logger').child({ __filename });

const DEVICE_LOOKUP_LOG_EVT = 'DEVICE_LOOKUP';

class FreeDeviceFinder {
  constructor(adb, deviceRegistry) {
    this.adb = adb;
    this.deviceRegistry = deviceRegistry;
  }

  async findFreeDevice(deviceQuery) {
    const { devices } = await this.adb.devices();
    for (const candidate of devices) {
      const isBusy = this.deviceRegistry.isDeviceBusy(candidate.adbName);
      if (isBusy) {
        log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Device ${candidate.adbName} is busy, skipping...`);
        continue;
      }

      const isOffline = candidate.status === 'offline';
      if (isOffline) {
        log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Device ${candidate.adbName} is offline, skipping...`);
        continue;
      }

      const isMatching = await this._isDeviceMatching(candidate, deviceQuery);
      if (isMatching) {
        log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Found a matching free device ${candidate.adbName}`);
        return candidate.adbName;
      } else {
        log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Device ${candidate.adbName} does not match "${deviceQuery}"`);
      }
    }

    return null;
  }

  /**
   * @protected
   */
  async _isDeviceMatching(candidate, deviceQuery) {
    return RegExp(deviceQuery).test(candidate.adbName);
  }
}

module.exports = FreeDeviceFinder;
