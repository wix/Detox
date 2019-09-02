const Emulator = require('../android/Emulator');
const AndroidDriver = require('./AndroidDriver');

class AttachedAndroidDriver extends AndroidDriver {

  constructor(config) {
    super(config);

    this.emulator = new Emulator();
    this._name = 'Unnamed Android Device';
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(name) {
    const deviceId = await this.findDeviceId({adbName: name});
    await this.adb.apiLevel(name);
    await this.adb.unlockScreen(deviceId);
    this._name = `${deviceId} (${name})`;
    return deviceId;
  }
}

module.exports = AttachedAndroidDriver;
