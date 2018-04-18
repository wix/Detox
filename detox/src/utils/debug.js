class Debug {
  async sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }
}

module.exports = new Debug();
