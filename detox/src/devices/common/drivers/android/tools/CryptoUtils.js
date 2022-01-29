const crypto = require('crypto-js');

class CryptoUtils {
  async getMd5(path) {
    return await crypto.md5(path);
  }
}

module.exports = CryptoUtils;
