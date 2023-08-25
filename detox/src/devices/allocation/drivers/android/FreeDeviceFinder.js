const detectConcurrentDetox = require('../../../../utils/detectConcurrentDetox');
const log = require('../../../../utils/logger').child({ cat: 'device' });

const DEVICE_LOOKUP = { event: 'DEVICE_LOOKUP' };

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

    const isTaken = this.deviceRegistry.includes(adbName);
    if (isTaken) {
      log.debug(DEVICE_LOOKUP, `Device ${adbName} is already taken, skipping...`);
      return false;
    }

    const isOffline = candidate.status === 'offline';
    if (isOffline) {
      log.debug(DEVICE_LOOKUP, `Device ${adbName} is offline, skipping...`);
      return false;
    }

    const isMatching = await this._isDeviceMatching(candidate, deviceQuery);
    if (!isMatching) {
      log.debug(DEVICE_LOOKUP, `Device ${adbName} does not match "${deviceQuery}"`);
      return false;
    }

    log.debug(DEVICE_LOOKUP, `Found a matching & free device ${candidate.adbName}`);
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
