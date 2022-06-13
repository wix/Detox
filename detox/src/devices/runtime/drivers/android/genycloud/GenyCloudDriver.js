// @ts-nocheck
const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDeviceDriverDeps } GenycloudDriverDeps
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

  /** @override */
  get deviceName() {
    return this.instance.toString();
  }

  async setLocation(lat, lon) {
    await this.invocationManager.execute(DetoxGenymotionManager.setLocation(parseFloat(lat), parseFloat(lon)));
  }

  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}

module.exports = GenyCloudDriver;
