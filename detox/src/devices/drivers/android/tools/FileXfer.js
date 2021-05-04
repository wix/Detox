const path = require('path');

class FileXfer {
  constructor(adb, destinationDir) {
    this._adb = adb;
    this._dir = destinationDir;
  }

  async prepareDestinationDir(adbName) {
    await this._adb.shell(adbName, `rm -fr ${this._dir}`);
    await this._adb.shell(adbName, `mkdir -p ${this._dir}`);
  }

  async send(adbName, sourcePath, destinationFilename) {
    const destinationPath = path.posix.join(this._dir, destinationFilename);
    await this._adb.push(adbName, sourcePath, destinationPath);
    return destinationPath;
  }
}

module.exports = FileXfer;
