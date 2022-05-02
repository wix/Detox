const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

      fileStream.pipe(hash);
    });
  }

  async saveHashToRemote(deviceId, bundleId, hash) {
    const hashFilename = `${bundleId}.hash`;

    this._createLocalHashFile(hashFilename, hash);
    await this._pushHashFileToDevice(deviceId, hashFilename);
    this._deleteLocalHashFile(hashFilename);
  }

  async compareRemoteToLocal(deviceId, bundleId, localHash) {
    const remoteHash = await this._hashXfer.readHashFile(deviceId, bundleId);
    return localHash === remoteHash;
  }

  _createLocalHashFile(hashFilename, hash) {
    fs.writeFileSync(hashFilename, hash);
  }

  async _pushHashFileToDevice(deviceId, hashFilename) {
    const destinationPath = path.posix.join(this._hashPath, hashFilename);
    await this._adb.push(deviceId, hashFilename, destinationPath);
  }

  _deleteLocalHashFile(hashFilename) {
    fs.unlinkSync(hashFilename);
  }
}

module.exports = HashHelper;
