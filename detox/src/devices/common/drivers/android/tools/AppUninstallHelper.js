class AppUninstallHelper {
  constructor(adb) {
    this._adb = adb;
  }

  async uninstall(bundleId) {
    if (await this._adb.isPackageInstalled(bundleId)) {
      await this._adb.uninstall(bundleId);
    }

    const testBundleId = `${bundleId}.test`;
    if (await this._adb.isPackageInstalled(testBundleId)) {
      await this._adb.uninstall(testBundleId);
    }
  }
}

module.exports = AppUninstallHelper;
