const AdbDevicesHelper = require('../tools/AdbDevicesHelper');
const log = require('../../../../utils/logger').child({ __filename });

const DEVICE_LOOKUP_LOG_EVT = 'DEVICE_LOOKUP';

class FreeEmulatorFinder {
  constructor(adb, deviceRegistry, avdName) {
    this._adbDevicesHelper = new AdbDevicesHelper(adb);
    this._deviceRegistry = deviceRegistry;
    this._avdName = avdName;

    this._matcherFn = this._matcherFn.bind(this);
  }

  async findFreeDevice() {
    return await this._adbDevicesHelper.lookupDevice(this._matcherFn);
  }

  async _matcherFn(candidate) {
    const isEmulator = candidate.type === 'emulator';
    const isBusy = this._deviceRegistry.isDeviceBusy(candidate.adbName);

    if (isEmulator && !isBusy) {
      if (await candidate.queryName() === this._avdName) {
        log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Found ${candidate.adbName}!`);
        return true;
      }
      log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `${candidate.adbName} is available but AVD is different`);
    }
    return false;
  }
}

module.exports = FreeEmulatorFinder;
