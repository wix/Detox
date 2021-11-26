// @ts-nocheck
const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDriverDeps } GenycloudDriverDeps
 */

/**
 * @typedef GenycloudDriverProps
 * @property instance { GenyInstance } The DTO associated with the cloud instance
 */

class GenyCloudDriver extends AndroidDriver {
  /**
   * @param deps { GenycloudDriverDeps }
   * @param props { GenycloudDriverProps }
   */
  constructor(deps, { instance }) {
    super(deps, { adbName: instance.adbName });
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
