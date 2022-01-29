const path = require('path');
const CryptoUtils = require('./CryptoUtils');

class FileXfer {
  constructor(adb, destinationDir) {
    this._adb = adb;
    this._dir = destinationDir;
  }

  async getFileHash(binary) {
    return await CryptoUtils.getMd5(`${this._dir}/${binary}`);
  }

  async createEmptyFile(deviceId, filename) {
    await this._adb.createEmptyFile(deviceId, this._dir, filename);
  }

  async deleteByExtension(deviceId, extension) {
    await this._adb.deleteByExtension(deviceId, this._dir, extension);
  }

  async checkFileExists(deviceId, filename) {
    return await this._adb.checkFileExists(deviceId, this._dir, filename);
  }

  async prepareDestinationDir(deviceId) {
    await this._adb.shell(deviceId, `rm -fr ${this._dir}`);
    await this._adb.shell(deviceId, `mkdir -p ${this._dir}`);
  }

  async send(deviceId, sourcePath, destinationFilename) {
    const destinationPath = path.posix.join(this._dir, destinationFilename);
    await this._adb.push(deviceId, sourcePath, destinationPath);
    return destinationPath;
  }
}

module.exports = FileXfer;
