// @ts-nocheck
class AppInstallHelper {
  constructor(adb, fileTransfer) {
    this._adb = adb;
    this._fileTransfer = fileTransfer;
  }

  async install(appBinaryPath, testBinaryPath) {
    await this._fileTransfer.prepareDestinationDir();
    await this._pushAndInstallBinary(appBinaryPath, 'Application.apk');
    if (testBinaryPath) {
      await this._pushAndInstallBinary(testBinaryPath, 'Test.apk');
    }
  }

  async _pushAndInstallBinary(binaryPath, binaryFilenameOnTarget) {
    const binaryPathOnTarget = await this._fileTransfer.send(binaryPath, binaryFilenameOnTarget);
    await this._adb.remoteInstall(binaryPathOnTarget);
  }
}

module.exports = AppInstallHelper;
