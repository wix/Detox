const argparse = require('../../../../../utils/argparse');
const AndroidDriver = require('../AndroidDriver');

// TODO Unit test coverage
class EmulatorDriver extends AndroidDriver {
  /**
   * @param adbName { String } The unique identifier associated with ADB
   * @param avdName { String } The name of the AVD (Android Virtual Device)
   * @param deps { Object }
   */
  constructor(adbName, avdName, deps) {
    super(adbName, deps);
    this._deviceName = `${adbName} (${avdName})`;
  }

  getDeviceName() {
    return this._deviceName;
  }

  async installApp(_binaryPath, _testBinaryPath) {
    if (argparse.getArgValue('force-adb-install') === 'true') {
      return await super.installApp(_binaryPath, _testBinaryPath);
    }

    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);

    await this.appInstallHelper.install(this.adbName, binaryPath, testBinaryPath);
  }

  async shutdown() {
    // TODO ASDASD move to parent?
    await this.instrumentation.setTerminationFn(null);
  }

  async setLocation(lat, lon) {
    await this.adb.setLocation(this.adbName, lat, lon);
  }
}

module.exports = EmulatorDriver;
