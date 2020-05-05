const AdbDevicesHelper = require('../tools/AdbDevicesHelper');
const log = require('../../../../utils/logger').child({ __filename });

const DEVICE_LOOKUP_EV = 'DEVICE_LOOKUP';

class FreeEmulatorFinder {
  constructor(adb, deviceRegistry, avdName) {
    this.avdName = avdName;
    this._adbDevicesHelper = new AdbDevicesHelper(adb);
    this._deviceRegistry = deviceRegistry;

    this._matcherFn = this._matcherFn.bind(this);
  }

  async findFreeDevice() {
    return await this._adbDevicesHelper.lookupDevice(this._matcherFn);
  }

  async _matcherFn(candidate) {
    const isEmulator = candidate.type === 'emulator';
    const isBusy = this._deviceRegistry.isDeviceBusy(candidate.adbName);

    if (isEmulator && !isBusy) {
      if (await candidate.queryName() === this.avdName) {
        log.debug({ event: DEVICE_LOOKUP_EV }, `Found ${candidate.adbName}!`);
        return true;
      }
      log.debug({ event: DEVICE_LOOKUP_EV }, `${candidate.adbName} is available but AVD is different`);
    }
    return false;
  }
}

module.exports = FreeEmulatorFinder;
