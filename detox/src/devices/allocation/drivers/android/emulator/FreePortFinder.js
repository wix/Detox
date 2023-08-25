class FreePortFinder {
  constructor({ min = 10000, max = 20000 } = {}) {
    this._min = min;
    this._max = max;
  }

  async findFreePort() {
    const min = this._min;
    const max = this._max;
    let port = Math.random() * (max - min) + min;
    port = port & 0xFFFFFFFE; // Should always be even
    return port;
  }
}

module.exports = FreePortFinder;
