// @ts-nocheck
const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDriverDeps } EmulatorDriverDeps
 */

/**
 * @typedef { AndroidDriverProps } EmulatorDriverProps
 * @property adbServerPort { Number }
 * @property avdName { String }
 * @property forceAdbInstall { Boolean }
 */

class EmulatorDriver extends AndroidDriver {
  /**
   * @param deps { EmulatorDriverDeps }
   * @param props { EmulatorDriverProps }
   */
  constructor(deps, { adbName, adbServerPort, avdName, forceAdbInstall }) {
    super(deps, { adbName });

    this._deviceName = `${adbName} (${avdName})`;
    this._adbServerPort = adbServerPort;
    this._forceAdbInstall = forceAdbInstall;
  }

  async init() {
    // This here comes instead of the utilization of the adb-server ports registry, which fundamentally aims to serve
    // the same purpose but in a more self-contained, pure way. It's required nonetheless as the right port needs
    // not only to be set in the current process, but also to be propagated onto (external?) child processes which
    // sometime need ADB access too (e.g. test reporters).
    // IMPORTANT: This approach relies on a premise where this runtime driver is unique within it's running
    // process. It will not work in a multi-device-in-one-process environment (case in which the registry should
    // be reconsidered).
    if (this._adbServerPort) {
      process.env.ANDROID_ADB_SERVER_PORT = this._adbServerPort;
    }
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
