class AppInstallHelper {
  constructor(adb, fileTransfer) {
    this._adb = adb;
    this._fileTransfer = fileTransfer;
  }

  async install(deviceId, appBinaryPath, testBinaryPath) {
    await this._fileTransfer.prepareDestinationDir(deviceId);
    await this._pushAndInstallBinary(deviceId, appBinaryPath, 'Application.apk');
    if (testBinaryPath) {
      await this._pushAndInstallBinary(deviceId, testBinaryPath, 'Test.apk');
    }
  }

  async _pushAndInstallBinary(deviceId, binaryPath, binaryFilenameOnTarget) {
    const binaryPathOnTarget = await this._fileTransfer.send(deviceId, binaryPath, binaryFilenameOnTarget);
    await this._adb.remoteInstall(deviceId, binaryPathOnTarget);
  }
}

module.exports = AppInstallHelper;
