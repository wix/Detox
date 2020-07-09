const FreeDeviceFinderBase = require('./FreeDeviceFinderBase');
const log = require('../../../utils/logger').child({ __filename });

const DEVICE_LOOKUP_LOG_EVT = 'DEVICE_LOOKUP';

class FreeAdbDeviceFinder extends FreeDeviceFinderBase {
  constructor(adb, deviceRegistry, adbNamePattern) {
    super(adb, deviceRegistry);
    this._adbNamePattern = adbNamePattern;
  }

  async _matcherFn(candidate) {
    const isBusy = this._deviceRegistry.isDeviceBusy(candidate.adbName);
    const matchesPattern = RegExp(this._adbNamePattern).test(candidate.adbName);

    if (!isBusy) {
      if (matchesPattern) {
        log.debug({ event: DEVICE_LOOKUP_LOG_EVT }, `Found ${candidate.adbName}!`);
        return true;
      }
      log.debug(
        { event: DEVICE_LOOKUP_LOG_EVT },
        `${candidate.adbName} is available but doesn't match the pattern "${this._adbNamePattern}"`
      );
    }
    return false;
  }
}

module.exports = FreeAdbDeviceFinder;
