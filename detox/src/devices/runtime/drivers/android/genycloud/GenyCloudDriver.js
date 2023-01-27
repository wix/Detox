// @ts-nocheck
const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDriverDeps } GenycloudDriverDeps
 */

/**
 * @typedef GenycloudDriverProps
 * @property instance { GenyInstance } The DTO associated with the cloud instance
 * @property forceAdbInstall { Boolean }
 */

class GenyCloudDriver extends AndroidDriver {
  /**
   * @param deps { GenycloudDriverDeps }
   * @param props { GenycloudDriverProps }
   */
  constructor(deps, { instance, forceAdbInstall }) {
    super(deps, { adbName: instance.adbName });
    this.instance = instance;
    this._forceAdbInstall = forceAdbInstall;
  }

  getDeviceName() {
    return this.instance.toString();
  }

  async setLocation(lat, lon) {
    await this.invocationManager.execute(DetoxGenymotionManager.setLocation(parseFloat(lat), parseFloat(lon)));
  }

  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    if (this._forceAdbInstall) {
      await super._installAppBinaries(appBinaryPath, testBinaryPath);
    } else {
      await this.__installAppBinaries(appBinaryPath, testBinaryPath);
    }
  }

  async __installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}

module.exports = GenyCloudDriver;
