class AppUninstallHelper {
  constructor(adb) {
    this._adb = adb;
  }

  async uninstall(deviceId, bundleId) {
    if (await this._adb.isPackageInstalled(deviceId, bundleId)) {
      await this._adb.uninstall(deviceId, bundleId);
    }

    const testBundleId = `${bundleId}.test`;
    if (await this._adb.isPackageInstalled(deviceId, testBundleId)) {
      await this._adb.uninstall(deviceId, testBundleId);
    }
  }
}

module.exports = AppUninstallHelper;
