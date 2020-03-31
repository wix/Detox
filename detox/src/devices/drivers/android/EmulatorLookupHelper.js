const log = require('../../../utils/logger').child({ __filename });
const AdbDevicesHelper = require('./AdbDevicesHelper');

const ACQUIRE_DEVICE_EV = 'ACQUIRE_DEVICE';

class EmulatorLookupHelper {
  constructor(adb, deviceRegistry, avdName) {
    this.adbDevicesHelper = new AdbDevicesHelper(adb);
    this.deviceRegistry = deviceRegistry;
    this.avdName = avdName;

    this._matcherFn = this._matcherFn.bind(this);
  }

  async findFreeDevice() {
    return await this.adbDevicesHelper.lookupDevice(this._matcherFn);
  }

  async _matcherFn(candidate) {
    const isEmulator = candidate.type === 'emulator';
    const isBusy = this.deviceRegistry.isDeviceBusy(candidate.adbName);

    if (isEmulator && !isBusy) {
      if (await candidate.queryName() === this.avdName) {
        log.debug({ event: ACQUIRE_DEVICE_EV }, `Found ${candidate.adbName}!`);
        return true;
      }
      log.debug({ event: ACQUIRE_DEVICE_EV }, `${candidate.adbName} is available but AVD is different`);
    } else {
      log.debug({ event: ACQUIRE_DEVICE_EV }, `${candidate.adbName} is not a free emulator`, isEmulator, !isBusy);
    }
    return false;
  }
}
module.exports = EmulatorLookupHelper;
