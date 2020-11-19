// TODO Tweak such that if apk's already exist on the device (need to store uniquely), they will not be resent (would optimize cloud, for example)

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
}

module.exports = AppInstallHelper;
