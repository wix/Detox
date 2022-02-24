const crypto = require('crypto');
const { DetoxRuntimeError } = require('../../../../../errors');

const SUPPORTED_HASH_TYPES = {
  MD5: 'md5',
}

const HASH_PATH = '/data/local/tmp/detox';

class HashHelper {
  constructor(adb, hashXfer, hashPath = HASH_PATH) {
    this._adb = adb;
    this._hashXfer  = hashXfer;
    this._hashPath = hashPath;
  }

  generateHash(path, hashType = SUPPORTED_HASH_TYPES.MD5) {
    if (!path) {
      throw new DetoxRuntimeError({
        message: `Path must be provided for hash generation`,
      });
    }

    switch (hashType) {
      case SUPPORTED_HASH_TYPES.MD5:
        return crypto.createHash('md5').update(path).digest("hex");
      default:
        throw new DetoxRuntimeError({
        message: `Hashtype is unsupported: ${hashType}`,
        hint: `Use a supported hashtype, such as MD5`,
      });
    }
  }

  async saveHashToRemote(deviceId, bundleId, hash) {
    const hashFileName = `${bundleId}.hash`;
    await this._adb.createFileWithContent(deviceId, this._hashPath, hashFileName, hash);
  }

  async compareRemoteToLocal(deviceId, bundleId, localHash) {
    const remoteHash = await this._hashXfer.readHashFile(deviceId, bundleId);
    console.log('remote hash is ' +remoteHash);
    console.log('local hash is ' +localHash);
    return localHash === remoteHash;
  }
}

module.exports = HashHelper;
