// @ts-nocheck
const DetoxGenymotionManager = require('../../../../../android/espressoapi/DetoxGenymotionManager');
const { AndroidDeviceDriver, AndroidAppDriver } = require('../AndroidDrivers');

/**
 * @typedef { AndroidDeviceDriverDeps } GenycloudDeviceDriverDeps
 */

/**
 * @typedef { Object } GenycloudDeviceDriverProps
 * @property instance { GenyInstance } The DTO associated with the cloud instance
 */

class GenycloudDeviceDriver extends AndroidDeviceDriver {
  /**
   * @param deps { GenycloudDeviceDriverDeps }
   * @param props { GenycloudDeviceDriverProps }
   */
  constructor(deps, { instance }) {
    super(deps, { adbName: instance.adbName });
    this.instance = instance;
  }

  /** @override */
  get deviceName() {
    return this.instance.toString();
  }
}

class GenycloudAppDriver extends AndroidAppDriver {
  constructor(deps, { instance }) {
    super(deps, { adbName: instance.adbName });
  }

  /** @override */
  async setLocation(lat, lon) {
    await this.invocationManager.execute(DetoxGenymotionManager.setLocation(parseFloat(lat), parseFloat(lon)));
  }

  /** @override */
  async _installAppBinaries(appBinaryPath, testBinaryPath) {
    await this.appInstallHelper.install(this.adbName, appBinaryPath, testBinaryPath);
  }
}

module.exports = {
  GenycloudDeviceDriver,
  GenycloudAppDriver,
};
