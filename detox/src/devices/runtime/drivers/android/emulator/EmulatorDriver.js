const AndroidDriver = require('../AndroidDriver');

// TODO Unit test coverage
class EmulatorDriver extends AndroidDriver {
  /**
   * @param deps { Object }
   * @param configs { Object }
   * @param configs.deviceConfig { Object }
   * @param adbName { String } The unique identifier associated with ADB
   */
  constructor(deps, { deviceConfig }, adbName) {
    super(deps, adbName);

    const { avdName } = deviceConfig.device;

    this._deviceName = `${adbName} (${avdName})`;
    this._forceAdbInstall = deviceConfig.forceAdbInstall;
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
