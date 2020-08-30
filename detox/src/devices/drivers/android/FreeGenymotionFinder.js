const FreeDeviceFinder = require('./tools/FreeDeviceFinder');

class FreeGenymotionFinder extends FreeDeviceFinder {
  /**
   * @override
   */
  async _isDeviceMatching(candidate, avdName) {
    return candidate.type === 'genymotion-cloud' && (await candidate.queryName()) === avdName;
  }
}

module.exports = FreeGenymotionFinder;
