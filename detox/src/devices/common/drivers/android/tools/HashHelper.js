const fs = require('fs');

class HashHelper {
  constructor(adb, tempFileXfer) {
    this._adb = adb;
    this._tempFileXfer = tempFileXfer;
  }

  async saveHashToRemote(deviceId, bundleId, hash) {
    const hashFilename = `${bundleId}.hash`;

    this._createLocalHashFile(hashFilename, hash);
    await this._tempFileXfer.send(deviceId, hashFilename, hashFilename);
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
