const FreeDeviceFinderBase = require('../tools/FreeDeviceFinderBase');

class FreeAdbDeviceFinder extends FreeDeviceFinderBase {
  async isDeviceMatching(candidate, adbNamePattern) {
    return RegExp(adbNamePattern).test(candidate.adbName);
  }  
}

module.exports = FreeAdbDeviceFinder;
