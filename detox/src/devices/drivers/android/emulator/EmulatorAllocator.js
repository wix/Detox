const EmulatorLauncher = require('./EmulatorLauncher');
const FreeEmulatorFinder = require('./FreeEmulatorFinder');
const log = require('../../../../utils/logger').child({ __filename });

const ALLOCATE_DEVICE_EV = 'ALLOCATE_DEVICE';
const DetoxEmulatorsPortRange = {
  min: 10000,
  max: 20000
};

class EmulatorAllocator {
  constructor(avdName, adb, deviceRegistry, emulatorExec) {
    this._avdName = avdName;
    this._freeEmuFinder = new FreeEmulatorFinder(adb, deviceRegistry, avdName);
    this._emuLauncher = new EmulatorLauncher(emulatorExec);

    this.coldBooted = undefined;
  }

  async allocate() {
    log.debug({ event: ALLOCATE_DEVICE_EV }, `Looking up a device based on ${this._avdName}`);

    let adbName = await this._freeEmuFinder.findFreeDevice();

    let launchPort;
    if (!adbName) {
      launchPort = this._allocateAdbPort();
      adbName = this._nameNewDevice(launchPort);
    }

    log.debug({ event: ALLOCATE_DEVICE_EV }, `Settled on ${adbName}`);

    if (launchPort) {
      await this._bootDevice(this._avdName, adbName, launchPort);
    }
    this.coldBooted = !!launchPort;

    return adbName;
  }

  _allocateAdbPort() {
    const {min, max} = DetoxEmulatorsPortRange;
    let port = Math.random() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even
    return port;
  }

  _nameNewDevice(port) {
    return `emulator-${port}`;
  }

  async _bootDevice(avdName, adbName, port) {
    await this._emuLauncher.launch(avdName, { port });
  }
}

module.exports = EmulatorAllocator;
