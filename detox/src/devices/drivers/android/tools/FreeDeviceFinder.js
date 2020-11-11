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
      if (await this._isDeviceFreeAndMatching(candidate, deviceQuery)) {
        return candidate.adbName;
      }
    }
    return null;
  }

  /**
   * @protected
   */
  async _isDeviceFreeAndMatching(candidate, deviceQuery) {
    const { adbName } = candidate;

    const isTaken = await this.deviceRegistry.includes(adbName);
    if (isTaken) {
      log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Device ${adbName} is already taken, skipping...`);
      return false;
    }

    const isOffline = candidate.status === 'offline';
    if (isOffline) {
      log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Device ${adbName} is offline, skipping...`);
      return false;
    }

    const isMatching = await this._isDeviceMatching(candidate, deviceQuery);
    if (!isMatching) {
      log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Device ${adbName} does not match "${deviceQuery}"`);
      return false;
    }

    log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Found a matching & free device ${candidate.adbName}`);
    return true;
  }

  /**
   * @protected
   */
  async _isDeviceMatching(candidate, deviceQuery) {
    return RegExp(deviceQuery).test(candidate.adbName);
  }
}

module.exports = FreeDeviceFinder;
