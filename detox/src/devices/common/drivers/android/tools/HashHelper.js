const SUPPORTED_HASH_TYPES = {
  MD5: 'MD5'
}

const HASH_PATH = '/data/local/tmp/detox';

class HashHelper {
  constructor(adb, hashXfer) {
    this._adb = adb;
    this._hashXfer  = hashXfer;
  }

  generateHash(path, hashType = SUPPORTED_HASH_TYPES.MD5) {
    const crypto = require('crypto');
    switch (hashType) {
      case SUPPORTED_HASH_TYPES.MD5:
      default:
        return crypto.createHash('md5').update(path).digest("hex");
    }
  }

  async saveHashToRemote(deviceId, bundleId, hash) {
    const hashFileName = `${bundleId}.hash`;
    await this._adb.createFileWithContent(deviceId, HASH_PATH, hashFileName, hash);
  }

  async isRemoteHashEqualToLocal(deviceId, bundleId, localHash) {
    const remoteHash = await this._hashXfer.readHashFile(deviceId, bundleId);
    return localHash === remoteHash;
  }
}

module.exports = HashHelper;
