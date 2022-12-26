const fs = require('fs');
const path = require('path');

const generateHash = require('../../../../../utils/generateHash');

const { FILE_PATH } = require('./TempFileTransfer');

class ApkHashUtils {
  constructor(props) {
    this.adb = props.adb;
  }

  async saveHashToDevice({ fileTransfer, bundleId, deviceId, binaryPath }) {
    const hashFilename = this._getHashFilename(bundleId);
    await this._createLocalHashFile(hashFilename, binaryPath);
    await fileTransfer.prepareDestinationDir(deviceId);
    await fileTransfer.send(deviceId, hashFilename, hashFilename);
    this._deleteLocalHashFile(hashFilename);
  }

  async isHashUpToDate({ deviceId, bundleId, binaryPath }) {
    const localHash = await generateHash(binaryPath);
    const destinationPath = path.posix.join(FILE_PATH, this._getHashFilename(bundleId));
    const remoteHash = await this.adb.readFile(deviceId, destinationPath, true);
    return localHash === remoteHash;
  }

  _getHashFilename(bundleId) {
    return `${bundleId}.hash`;
  }

  async _createLocalHashFile(hashFilename, binaryPath) {
    const hash = await generateHash(binaryPath);
    fs.writeFileSync(hashFilename, hash);
  }

  _deleteLocalHashFile(hashFilename) {
    fs.unlinkSync(hashFilename);
  }
}

module.exports = ApkHashUtils;
