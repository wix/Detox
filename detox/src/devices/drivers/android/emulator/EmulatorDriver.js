const argparse = require('../../../../utils/argparse');
const AndroidDriver = require('../AndroidDriver');

class EmulatorDriver extends AndroidDriver {
  async installApp(deviceId, _binaryPath, _testBinaryPath) {
    if (argparse.getArgValue('force-adb-install') === 'true') {
      return await super.installApp(deviceId, _binaryPath, _testBinaryPath);
    }

    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);

    await this.appInstallHelper.install(deviceId, binaryPath, testBinaryPath);
  }

  async shutdown(deviceId) {
    // TODO ASDASD move to parent?
    await this.instrumentation.setTerminationFn(null);
  }

  async setLocation(deviceId, lat, lon) {
    await this.adb.setLocation(deviceId, lat, lon);
  }
}

module.exports = EmulatorDriver;
