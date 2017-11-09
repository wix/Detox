const _ = require('lodash');
const AAPT = require('./android/AAPT');
const Emulator = require('./android/Emulator');
const AndroidDriver = require('./AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {

  constructor(client) {
    super(client);

    this.aapt = new AAPT();
    this.emulator = new Emulator();
  }

  async acquireFreeDevice(name) {
    const adbDevices = await this.adb.devices();
    const filteredDevices = _.filter(adbDevices, {name: name});

    let adbName;
    switch (filteredDevices.length) {
      case 1:
        const adbDevice = filteredDevices[0];
        adbName = adbDevice.adbName;
        break;
      case 0:
        throw new Error(`Could not find '${name}' on the currently ADB attached devices, 
      try restarting adb 'adb kill-server && adb start-server'`);
        break;
      default:
        throw new Error(`Got more than one device corresponding to the name: ${name}`);
    }

    await this.adb.unlockScreen(adbName);
    return adbName;
  }
}

module.exports = AttachedAndroidDriver;