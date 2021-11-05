const FreeDeviceFinder = require('../../../../common/drivers/android/tools/FreeDeviceFinder');

class FreeEmulatorFinder extends FreeDeviceFinder {
  /**
   * @override
   */
  async _isDeviceMatching(candidate, avdName) {
    return candidate.type === 'emulator' && (await candidate.queryName()) === avdName;
  }
}

module.exports = FreeEmulatorFinder;
