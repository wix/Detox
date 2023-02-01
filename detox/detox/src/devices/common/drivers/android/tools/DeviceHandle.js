class DeviceHandle {
  constructor(deviceString) {
    const [adbName, status] = deviceString.split('\t');
    this.type = this._inferDeviceType(adbName);
    this.adbName = adbName;
    this.status = status;
  }

  _inferDeviceType(adbName) {
    if (adbName.startsWith('emulator-')) {
      return 'emulator';
    }

    if (/^((1?\d?\d|25[0-5]|2[0-4]\d)(\.|:)){4}[0-9]{4}/.test(adbName)) {
      return 'genymotion';
    }

    return 'device';
  }
}

module.exports = DeviceHandle;
