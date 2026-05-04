const net = require('net');

/**
 * Checks if a given port is currently taken (in use)
 * Uses a two-step approach:
 * 1. First tries to connect to the port (detects services like ADB that are listening)
 * 2. If connection fails, tries to bind to the port (detects if port is in use)
 *
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function isPortTaken(port) {
  return new Promise((resolve, reject) => {
    function tryBind() {
      const tester = net.createServer()
        .once('error', /** @param {*} err */ (err) => {
          /* istanbul ignore next */
          return err && err.code === 'EADDRINUSE' ? resolve(true) : reject(err);
        })
        .once('listening', () => {
          tester.once('close', () => resolve(false)).close();
        })
        .listen(port);
    }

    // Try to connect to the port to detect if something is listening (e.g., ADB server)
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      // Connection timeout means port might be free, try binding instead
      tryBind();
    }, 100);

    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });

    socket.once('error', /** @param {NodeJS.ErrnoException} _err */ (_err) => {
      clearTimeout(timeout);
      tryBind();
    });

    socket.connect(port, 'localhost');
  });
}

module.exports = {
  isPortTaken,
};
