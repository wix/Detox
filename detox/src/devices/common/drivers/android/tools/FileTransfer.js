const path = require('path');

class FileTransfer {
  constructor(adb, destinationDir) {
    this._adb = adb;
    this._dir = destinationDir;
  }

  async prepareDestinationDir() {
    await this._adb.shell(`rm -fr ${this._dir}`);
    await this._adb.shell(`mkdir -p ${this._dir}`);
  }

  async send(sourcePath, destinationFilename) {
    const destinationPath = path.posix.join(this._dir, destinationFilename);
    await this._adb.push(sourcePath, destinationPath);
    return destinationPath;
  }
}

module.exports = FileTransfer;
