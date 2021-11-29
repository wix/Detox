class AppInstallHelper {
  constructor(adb, fileXfer) {
    this._adb = adb;
    this._fileXfer = fileXfer;
  }

  async install(deviceId, appBinaryPath, testBinaryPath) {
    await this._fileXfer.prepareDestinationDir(deviceId);
    await this._pushAndInstallBinary(deviceId, appBinaryPath, 'Application.apk');
    if (testBinaryPath) {
      await this._pushAndInstallBinary(deviceId, testBinaryPath, 'Test.apk');
    }
  }

  async _pushAndInstallBinary(deviceId, binaryPath, binaryFilenameOnTarget) {
    const binaryPathOnTarget = await this._fileXfer.send(deviceId, binaryPath, binaryFilenameOnTarget);
    await this._adb.remoteInstall(deviceId, binaryPathOnTarget);
  }

  async checkInstalled(deviceId, bundleId) {
    return await this._adb.checkInstalled(deviceId, bundleId);
  }

  async getRemoteVersionNumber(deviceId, bundleId) {
    const adbResponse = await this._adb.getRemoteVersionNumber(deviceId, bundleId);
    return this._formatVersionNumber(adbResponse);
  }

  _formatVersionNumber(adbResponse) {
    let res = '';
    if (adbResponse) {
      const splitUp = adbResponse.split('=');
      res = splitUp.length > 1 ? splitUp[1] : '';
    }
    return res;
  }

  async getLocalVersionNumber() {
    const wd = process.cwd();
    return wd ? require(`${wd}/package.json`).version : '';
  }

  async clearUserData(deviceId, bundleId) {
    return await this._adb.clearUserData(deviceId, bundleId);
  }
}

module.exports = AppInstallHelper;
