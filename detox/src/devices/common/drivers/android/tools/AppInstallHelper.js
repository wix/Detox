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

  async clearAppData(deviceId, bundleId) {
    return await this._adb.clearAppData(deviceId, bundleId);
  }

  async getLocalBinaryHash(binary) {
    const { getMd5 } = require('./CryptoUtils');
    await getMd5(binary);
  }

  async isAlreadyInstalled(deviceId, filehash) {
    return await this._fileXfer.checkFileExists(deviceId,`${filehash}.hash`);
  }

  async _removeExistingFileHashes(deviceId) {
    return await this._fileXfer.deleteByExtension(deviceId, 'hash');
  }

  async recordHash(deviceId, filehash) {
    await this._removeExistingFileHashes(deviceId);
    await this._fileXfer.createEmptyFile(deviceId,`${filehash}.hash`);
  }
}

module.exports = AppInstallHelper;
