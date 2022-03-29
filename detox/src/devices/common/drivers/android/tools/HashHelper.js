const crypto = require('crypto');
const fs = require('fs');

const { DetoxInternalError } = require('../../../../../errors');

const HASH_PATH = '/data/local/tmp/detox';

class HashHelper {
  constructor(adb, hashXfer, hashPath = HASH_PATH) {
    this._adb = adb;
    this._hashXfer  = hashXfer;
    this._hashPath = hashPath;
  }

  async generateHash(path) {
    if (!path) {
      throw new DetoxInternalError(`Path must be provided for hash generation`);
    }

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(path);
      const hash = crypto.createHash('md5');
      hash.setEncoding('hex');

      fileStream
        .on('end', function() {
          hash.end();
          resolve(hash.read());
        })
        .on('error', reject);

      // read all file and pipe it (write it) to the hash object
      fileStream.pipe(hash);
    });
  }

  async saveHashToRemote(deviceId, bundleId, hash) {
    const hashFilePath = `${this._hashPath}/${bundleId}.hash`;
    await this._adb.createFileWithContent(deviceId, hashFilePath, hash);
  }

  async compareRemoteToLocal(deviceId, bundleId, localHash) {
    const remoteHash = await this._hashXfer.readHashFile(deviceId, bundleId);
    return localHash === remoteHash;
  }
}

module.exports = HashHelper;
