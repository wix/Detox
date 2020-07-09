const FreeDeviceFinderBase = require('../FreeDeviceFinderBase');
const log = require('../../../../utils/logger').child({ __filename });

const DEVICE_LOOKUP_LOG_EVT = 'DEVICE_LOOKUP';

class FreeEmulatorFinder extends FreeDeviceFinderBase {
  constructor(adb, deviceRegistry, avdName) {
    super(adb, deviceRegistry);
    this._avdName = avdName;
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
