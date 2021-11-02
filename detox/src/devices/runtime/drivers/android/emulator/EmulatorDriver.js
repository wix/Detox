const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDriverDeps } EmulatorDriverDeps
 */

/**
 * @typedef { AndroidDriverProps } EmulatorDriverProps
 * @property avdName { String }
 * @property forceAdbInstall { Boolean }
 */

// TODO Unit test coverage
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

  async installApp(_binaryPath, _testBinaryPath) {
    if (this._forceAdbInstall) {
      await super.installApp(_binaryPath, _testBinaryPath);
    } else {
      await this._installApp(_binaryPath, _testBinaryPath);
    }
  }

  async setLocation(lat, lon) {
    await this.adb.setLocation(this.adbName, lat, lon);
  }

  async _installApp(_binaryPath, _testBinaryPath) {
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);

    await this.appInstallHelper.install(this.adbName, binaryPath, testBinaryPath);
  }
}

module.exports = EmulatorDriver;
