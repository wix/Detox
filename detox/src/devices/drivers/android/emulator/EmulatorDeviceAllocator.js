const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');
const FreeEmulatorFinder = require('./FreeEmulatorFinder');

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

class EmulatorDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, adb) {
    super(deviceRegistry);
    this._freeDeviceFinder = new FreeEmulatorFinder(adb, this.deviceRegistry); // TODO push this back to the driver
  }

  async _preAllocateDevice(deviceQuery, cookie) {
    await super._preAllocateDevice(deviceQuery);
    cookie.placeholderPort = undefined;
  }

  async _allocateDeviceSynchronized(deviceQuery, cookie) {
    const freeEmulatorAdbName = await this._freeDeviceFinder.findFreeDevice(deviceQuery);
    if (freeEmulatorAdbName) {
      return freeEmulatorAdbName;
    }

    cookie.placeholderPort = this._allocateEmulatorPlaceholder();
    return `emulator-${cookie.placeholderPort}`;
  }

  async _postAllocateDevice(deviceQuery, deviceId, cookie) {
    await super._postAllocateDevice(deviceQuery, deviceId);
    return {
      adbName: deviceId,
      placeholderPort: cookie.placeholderPort,
    }
  }

  _allocateEmulatorPlaceholder() {
    const { min, max } = DetoxEmulatorsPortRange;
    let port = Math.random() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even
    return port;
  }
}

module.exports = EmulatorDeviceAllocator;
