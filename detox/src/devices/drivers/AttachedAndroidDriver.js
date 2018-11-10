const Emulator = require('../android/Emulator');
const AndroidDriver = require('./AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {

  constructor(config) {
    super(config);

    this.emulator = new Emulator();
  }

  async acquireFreeDevice(name) {
    const deviceId = await this.findDeviceId({adbName: name});
    await this.adb.apiLevel(name);
    await this.adb.unlockScreen(deviceId);
    return deviceId;
  }
}

module.exports = AttachedAndroidDriver;
