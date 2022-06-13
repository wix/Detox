// @ts-nocheck
const { AndroidDeviceDriver, AndroidAppDriver } = require('../AndroidDrivers');

/**
 * @typedef { AndroidDeviceDriverDeps } EmulatorDeviceDriverDeps
 */

class EmulatorDeviceDriver extends AndroidDeviceDriver {
  /**
   * @param deps { EmulatorDeviceDriverDeps }
   * @param props {{ adbName: String, avdName: String }}
   */
  constructor(deps, { adbName, avdName }) {
    super(deps, { adbName });

    this._deviceName = `${adbName} (${avdName})`;
  }

  /** @override */
  get deviceName() {
    return this._deviceName;
  }

  async setLocation(lat, lon) {
    await this.adb.setLocation(this.adbName, lat, lon);
  }
}

class EmulatorAppDriver extends AndroidAppDriver {
  /**
   * @param deps { AndroidAppDriverDeps }
   * @param props {{ adbName: String, forceAdbInstall: Boolean }}
   */
  constructor(deps, { adbName, forceAdbInstall }) {
    super(deps, { adbName });

    this._forceAdbInstall = forceAdbInstall;
  }

  /** @override */
  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    if (this._forceAdbInstall) {
      await super._installAppBinaries(appBinaryPath, testBinaryPath);
    } else {
      await this.__installAppBinaries(appBinaryPath, testBinaryPath);
    }
  }

  async __installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}


module.exports = {
  EmulatorDeviceDriver,
  EmulatorAppDriver,
};
