const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const AndroidDriver = require('../AndroidDriver');

class GenyCloudDriver extends AndroidDriver {
  /**
   * @param instance { GenyInstance } The DTO associated with the cloud instance
   * @param deps { Object }
   */
  constructor(instance, deps) {
    super(instance.adbName, deps);
    this.instance = instance;
  }

  getDeviceName() {
    return this.instance.toString();
  }

  async installApp(_binaryPath, _testBinaryPath) {
    const {
      binaryPath,
      testBinaryPath,
    } = this._getInstallPaths(_binaryPath, _testBinaryPath);
    await this.appInstallHelper.install(this.adbName, binaryPath, testBinaryPath);
  }

  async setLocation(lat, lon) {
    await this.invocationManager.execute(DetoxGenymotionManager.setLocation(parseFloat(lat), parseFloat(lon)));
  }
}

module.exports = GenyCloudDriver;
