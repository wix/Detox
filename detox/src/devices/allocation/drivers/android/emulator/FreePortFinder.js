const net = require('net');

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
    } while (await this.isPortTaken(port));

    return port;
  }

  async isPortTaken(port) {
    return new Promise((resolve, reject) => {
      const tester = net.createServer()
        .once('error', /** @param {*} err */ (err) => {
          /* istanbul ignore next */
          return err && err.code === 'EADDRINUSE' ? resolve(true) : reject(err);
        })
        .once('listening', () => {
          tester.once('close', () => resolve(false)).close();
        })
        .listen(port);
    });
  }
}

module.exports = FreePortFinder;
