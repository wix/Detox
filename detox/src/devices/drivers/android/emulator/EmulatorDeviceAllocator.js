const AndroidDeviceAllocator = require('../AndroidDeviceAllocator');
const logger = require('../../../../utils/logger').child({ __filename });

const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

// TODO unit test
class EmulatorDeviceAllocator extends AndroidDeviceAllocator {
  constructor(deviceRegistry, freeDeviceFinder) {
    super(deviceRegistry, logger);
    this._freeDeviceFinder = freeDeviceFinder;
  }

  async _doAllocateDevice(deviceQuery) {
    let placeholderPort = null;
    let adbName = null;

    await this.deviceRegistry.allocateDevice(async () => {
      adbName = await this._freeDeviceFinder.findFreeDevice(deviceQuery);
      if (!adbName) {
        placeholderPort = this._allocateEmulatorPlaceholderPort();
        adbName = `emulator-${placeholderPort}`;
      }
      return adbName;
    });

    return {
      adbName,
      placeholderPort,
      toString: () => adbName,
    }
  }

  _allocateEmulatorPlaceholderPort() {
    const { min, max } = DetoxEmulatorsPortRange;
    let port = Math.random() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even
    return port;
  }
}

module.exports = EmulatorDeviceAllocator;
