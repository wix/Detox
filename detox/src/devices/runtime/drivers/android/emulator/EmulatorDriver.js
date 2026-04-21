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
  constructor(deps, { adbName, avdName, forceAdbInstall }) {
    super(deps, { adbName });

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

  async setBiometricEnrollment(yesOrNo, options) {
    const enabled = yesOrNo === 'YES';
    if (options && options.androidFace) {
      // Face HAL activation may reboot the emulator; disarm the unexpected-
      // termination handler so its adb-reverse cleanup doesn't fire while the
      // device is offline.
      if (this.instrumentation && this.instrumentation.setTerminationFn) {
        this.instrumentation.setTerminationFn(null);
      }
      await this.adb.setFaceEnrollment(this.adbName, enabled);
    } else {
      await this.adb.setBiometricEnrollment(this.adbName, enabled);
    }
  }

  async matchFinger() {
    await this.adb.matchFinger(this.adbName);
  }

  async unmatchFinger() {
    await this.adb.unmatchFinger(this.adbName);
  }

  async matchFace() {
    await this.adb.matchFace(this.adbName);
  }

  async unmatchFace() {
    await this.adb.unmatchFace(this.adbName);
  }

  async __installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}

module.exports = EmulatorDriver;
