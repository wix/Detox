// @ts-nocheck
const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDriverDeps } EmulatorDriverDeps
 */

/**
 * @typedef { AndroidDriverProps } EmulatorDriverProps
 * @property avdName { String }
 * @property forceAdbInstall { Boolean }
 */

class EmulatorDriver extends AndroidDriver {
  /**
   * @param deps { EmulatorDriverDeps }
   * @param props { EmulatorDriverProps }
   */
  constructor(deps, props) {
    super(deps, props);

    const { adbName, avdName, forceAdbInstall } = props;

    this._deviceName = `${adbName} (${avdName})`;
    this._forceAdbInstall = forceAdbInstall;
  }

  getDeviceName() {
    return this._deviceName;
  }

  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    if (this._forceAdbInstall) {
      await super._installAppBinaries(appBinaryPath, testBinaryPath);
    } else {
      await this.__installAppBinaries(appBinaryPath, testBinaryPath);
    }
  }

  async setLocation(lat, lon) {
    await this.adb.setLocation(this.adbName, lat, lon);
  }

  async __installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}

module.exports = EmulatorDriver;
