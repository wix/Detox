const AdbDevicesHelper = require('./tools/AdbDevicesHelper');

class FreeDeviceFinderBase {
  constructor(adb, deviceRegistry) {
    this._adbDevicesHelper = new AdbDevicesHelper(adb);
    this._deviceRegistry = deviceRegistry;

    this._matcherFn = this._matcherFn.bind(this);
  }

  async findFreeDevice() {
    return await this._adbDevicesHelper.lookupDevice(this._matcherFn);
  }

  async _matcherFn(candidate) {
    throw Error('Not implemented!');
  }
}

module.exports = FreeDeviceFinderBase;
