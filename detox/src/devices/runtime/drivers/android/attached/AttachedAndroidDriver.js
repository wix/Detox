// TODO (multiapps)

const { AndroidDeviceDriver, AndroidAppDriver } = require('../AndroidDrivers');

class AttachedAndroidDriver extends AndroidDeviceDriver {
  /** @override */
  get deviceName() {
    return `AttachedDevice:${this.adbName}`;
  }
}

module.exports = {
  AttachedAndroidDriver,

};
