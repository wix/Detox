class AppInstallHelper {
  constructor(adb, fileXfer) {
    this._adb = adb;
    this._fileXfer = fileXfer;
  }

  async install(deviceId, appBinaryPath, testBinaryPath) {
    await this._fileXfer.prepareDestinationDir(deviceId);

    const appBinaryPathOnTarget = this._getTargetBinaryName(false);
    await this._pushAndInstallBinary(deviceId, appBinaryPath, appBinaryPathOnTarget);

    const testBinaryPathOnTarget = this._getTargetBinaryName(true);
    await this._pushAndInstallBinary(deviceId, testBinaryPath, testBinaryPathOnTarget);
  }

  async _pushAndInstallBinary(deviceId, binaryPath, binaryFilenameOnTarget) {
    const binaryPathOnTarget = await this._fileXfer.send(deviceId, binaryPath, binaryFilenameOnTarget);
    await this._adb.remoteInstall(deviceId, binaryPathOnTarget);
  }

  _getTargetBinaryName(isTestBinary) {
    return isTestBinary ? 'Test.apk' : 'Application.apk';
  }
}

module.exports = AppInstallHelper;
