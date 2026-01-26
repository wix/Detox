const { isPortTaken } = require('../../../../../utils/netUtils');

class FreePortFinder {
  constructor({ min = 10000, max = 20000 } = {}) {
    this._min = min;
    this._max = max;
  }

  async findFreePort() {
    let port;

    do {
      const min = this._min;
      const max = this._max;
      port = Math.random() * (max - min) + min;
      port = port & 0xFFFFFFFE; // Should always be even
    } while (await isPortTaken(port));

    return port;
  }
}

module.exports = FreePortFinder;
