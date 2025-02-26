// @ts-nocheck
const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const AndroidDriver = require('../AndroidDriver');

/**
 * @typedef { AndroidDriverDeps } GenycloudDriverDeps
 * @property { GenyCloudADB } adb
 */

/**
 * @typedef GenycloudDriverProps
 * @property adbName { GenyInstance } The DTO associated with the cloud instance
 */

class GenyCloudDriver extends AndroidDriver {
  /**
   * @param deps { GenycloudDriverDeps }
   * @param props { GenycloudEmulatorCookie }
   */
  constructor(deps, { adbName, name }) {
    super(deps, { adbName });

    this._instanceName = name;

    this.adb.setOnReconnect(this.onDeviceReconnect.bind(this));
  }

  onDeviceReconnect({ adbName }) {
    this.adbName = adbName;
  }

  getDeviceName() {
    return this._instanceName;
  }

  async setLocation(lat, lon) {
    await this.invocationManager.execute(DetoxGenymotionManager.setLocation(parseFloat(lat), parseFloat(lon)));
  }

  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}

module.exports = GenyCloudDriver;
