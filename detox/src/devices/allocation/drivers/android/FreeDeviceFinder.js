/**
 * @typedef {import('../../../common/drivers/android/tools/DeviceHandle')} DeviceHandle
 * @typedef {import('../../../common/drivers/android/tools/EmulatorHandle')} EmulatorHandle
 */

const log = require('../../../../utils/logger').child({ cat: 'device' });

const DEVICE_LOOKUP = { event: 'DEVICE_LOOKUP' };

class FreeDeviceFinder {
  /**
   * @param {import('../../DeviceRegistry')} deviceRegistry
   */
  constructor(deviceRegistry) {
    this.deviceRegistry = deviceRegistry;
  }

  /**
   * @param {DeviceHandle[]} candidates
   * @param {string} deviceQuery
   * @returns {Promise<import('../../../common/drivers/android/tools/EmulatorHandle') | null>}
   */
  async findFreeDevice(candidates, deviceQuery) {
    const takenDevices = this.deviceRegistry.getTakenDevicesSync();
    for (const candidate of candidates) {
      if (await this._isDeviceFreeAndMatching(takenDevices, candidate, deviceQuery)) {
        // @ts-ignore
        return candidate;
      }
    }
    return null;
  }

  /**
   * @private
   */
  async _isDeviceFreeAndMatching(takenDevices, candidate, deviceQuery) {
    const { adbName } = candidate;

    const isTaken = takenDevices.includes(adbName);
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
