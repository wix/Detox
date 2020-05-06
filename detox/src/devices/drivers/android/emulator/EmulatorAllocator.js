const EmulatorLauncher = require('./EmulatorLauncher');
const AdbDevicesHelper = require('../tools/AdbDevicesHelper');
const log = require('../../../../utils/logger').child({ __filename });

const ALLOCATE_DEVICE_EV = 'ALLOCATE_DEVICE';

class EmulatorAllocator {
  constructor(avdName, adb, emulatorExec) {
    this._avdName = avdName;
    this._adb = adb;
    this._emulatorExec = emulatorExec;

    this.coldBooted = undefined;
  }

  async allocate() {
    log.debug({ event: ALLOCATE_DEVICE_EV }, `Looking up a device based on ${this._avdName} over ADB-server in port ${this._adb.port}`);

    const adbDevicesHelper = new AdbDevicesHelper(this._adb);
    let adbName = await adbDevicesHelper.lookupDevice(() => true);

    let launchPort;
    if (!adbName) {
      launchPort = this._adbPortToDevicePort(this._adb.port);
      adbName = this._nameNewDevice(launchPort);
    }

    log.debug({ event: ALLOCATE_DEVICE_EV }, `Settled on ${adbName}`);

    if (launchPort) {
      const emulatorLauncher = new EmulatorLauncher(this._emulatorExec);
      await emulatorLauncher.launch(this._avdName, { port: launchPort });
    }
    this.coldBooted = !!launchPort;

    return adbName;
  }

  _adbPortToDevicePort(adbPort) {
    return adbPort - 10000;
  }

  _nameNewDevice(port) {
    return `emulator-${port}`;
  }
}

module.exports = EmulatorAllocator;
