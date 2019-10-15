const _ = require('lodash');
const AndroidDriver = require('./AndroidDriver');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');

class AttachedAndroidDriver extends AndroidDriver {

  constructor(config) {
    super(config);
    this._name = 'Unnamed Android Device';
  }

  get name() {
    return this._name;
  }

  async acquireFreeDevice(deviceQuery) {
    const adbName = _.isPlainObject(deviceQuery) ? deviceQuery.adbName : deviceQuery;
    const { devices, stdout } = await this.adb.devices();

    if (!devices.some(d => d.adbName === adbName)) {
      throw new DetoxRuntimeError({
        message: `Could not find '${adbName}' on the currently ADB attached devices:`,
        debugInfo: stdout,
        hint: `Make sure your device is connected.\n` +
              `You can also try restarting adb with 'adb kill-server && adb start-server'.`
      });
    }

    await this.adb.apiLevel(adbName);
    await this.adb.unlockScreen(adbName);
    this._name = adbName;

    return adbName;
  }
}

module.exports = AttachedAndroidDriver;
