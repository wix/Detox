const FreeDeviceFinder = require('../FreeDeviceFinder');

class FreeEmulatorFinder extends FreeDeviceFinder {
  /**
   * @param {import('../../../DeviceRegistry')} deviceRegistry
   */
  constructor(deviceRegistry) {
    super(deviceRegistry);
  }

  /**
   * @override
   */
  async _isDeviceMatching(candidate, avdName) {
    return candidate.type === 'emulator' && (await candidate.queryName()) === avdName;
  }
}

module.exports = FreeEmulatorFinder;
