const FreeDeviceFinderBase = require('../tools/FreeDeviceFinderBase');

class FreeEmulatorFinder extends FreeDeviceFinderBase {
  async isDeviceMatching(candidate, avdName) {
    return candidate.type === 'emulator' && (await candidate.queryName()) === avdName;
  }
}

module.exports = FreeEmulatorFinder;
