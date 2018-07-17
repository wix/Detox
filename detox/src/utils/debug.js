const _sleep = require('./sleep');

class Debug {
  async sleep(ms) {
    await _sleep(ms);
  }
}

module.exports = new Debug();
