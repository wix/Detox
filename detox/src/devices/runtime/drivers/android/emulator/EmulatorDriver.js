const argparse = require('../../../../../utils/argparse');
const AndroidDriver = require('../AndroidDriver');

class EmulatorDriver extends AndroidDriver {
  constructor(deviceCookie, config) {
    super(deviceCookie, config);
  }

  getDeviceName() {
    const { adbName, avdName } = this.cookie;
    return `${adbName} (${avdName})`;
  }

  async installApp(_binaryPath, _testBinaryPath) {
    const { adbName } = this.cookie;

    if (argparse.getArgValue('force-adb-install') === 'true') {
      return await super.installApp(_binaryPath, _testBinaryPath);
    }

    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);

    await this.appInstallHelper.install(adbName, binaryPath, testBinaryPath);
  }

  async shutdown() {
    // TODO ASDASD move to parent?
    await this.instrumentation.setTerminationFn(null);
  }

  async setLocation(lat, lon) {
    const { adbName } = this.cookie;
    await this.adb.setLocation(adbName, lat, lon);
  }
}

module.exports = EmulatorDriver;
