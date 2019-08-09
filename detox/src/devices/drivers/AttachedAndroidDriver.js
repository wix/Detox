const AndroidDriver = require('./AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {

  constructor(config) {
    super(config);
  }

  async acquireFreeDevice(name) {
    const deviceId = await this.findDeviceId({adbName: name});
    await this.adb.apiLevel(name);
    await this.adb.unlockScreen(deviceId);
    return deviceId;
  }
}

module.exports = AttachedAndroidDriver;
