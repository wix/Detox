const path = require('path');

class FileTransfer {
  constructor(adb, destinationDir) {
    this._adb = adb;
    this._dir = destinationDir;
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

module.exports = FileTransfer;
