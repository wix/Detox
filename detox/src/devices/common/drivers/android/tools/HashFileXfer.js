const FileXfer = require('./FileXfer');
const path = require('path');

const HASH_PATH = '/data/local/tmp/detox';

class HashFileXfer extends FileXfer {
  /**
   * @param adb
   */
  constructor(adb) {
    super(adb, HASH_PATH);
  }

  async readHashFile(deviceId, bundleId) {
    const filePath = path.join(this._dir, `${bundleId}.hash`);
    return await this._adb.readFile(deviceId, filePath, true);
  }
}

module.exports = HashFileXfer;
