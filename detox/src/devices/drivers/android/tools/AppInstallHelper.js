// TODO Tweak such that if apk's already exist on the device (need to store uniquely), they will not be resent (would optimize cloud, for example)

class AppInstallHelper {
  /**
   * @param adb {ADB}
   * @param fileXfer {FileXfer}
   */
  constructor(adb, fileXfer) {
    this._adb = adb;
    this._fileXfer = fileXfer;
  }

  async install(adbName, appBinaryPath, testBinaryPath) {
    await this._fileXfer.prepareDestinationDir(adbName);
    await this._pushAndInstallBinary(adbName, appBinaryPath, 'Application.apk');
    if (testBinaryPath) {
      await this._pushAndInstallBinary(adbName, testBinaryPath, 'Test.apk');
    }
  }

  async _pushAndInstallBinary(adbName, binaryPath, binaryFilenameOnTarget) {
    const binaryPathOnTarget = await this._fileXfer.send(adbName, binaryPath, binaryFilenameOnTarget);
    await this._adb.remoteInstall(adbName, binaryPathOnTarget);
  }
}

module.exports = AppInstallHelper;
