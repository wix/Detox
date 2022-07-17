const fs = require('fs');

class HashHelper {
  constructor(adb, tempFileTransfer) {
    this._adb = adb;
    this._tempFileTransfer = tempFileTransfer;
  }

  async saveHashToRemote(deviceId, bundleId, hash) {
    const hashFilename = `${bundleId}.hash`;

    this._createLocalHashFile(hashFilename, hash);
    await this._tempFileTransfer.prepareDestinationDir(deviceId);
    await this._tempFileTransfer.send(deviceId, hashFilename, hashFilename);
    this._deleteLocalHashFile(hashFilename);
  }

  _createLocalHashFile(hashFilename, hash) {
    fs.writeFileSync(hashFilename, hash);
  }

  _deleteLocalHashFile(hashFilename) {
    fs.unlinkSync(hashFilename);
  }
}

module.exports = HashHelper;
