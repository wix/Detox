const WebSocket = require('ws');
const DetoxSessionManager = require('./DetoxSessionManager');
const log = require('../utils/logger').child({ __filename });

class DetoxServer {
  /**
   * @param {number} options.port
   * @param {boolean} options.standalone
   */
  constructor(options) {
    this._onConnection = this._onConnection.bind(this);

    this._options = options;
    this._sessionManager = new DetoxSessionManager();
    this._wss = null;
  }

  async open() {
    await this._startListening();

    const level = this._options.standalone ? 'info' : 'debug';
    log[level](`Detox server listening on localhost:${this._wss.options.port}...`);
  }

  async close() {
    await this._closeWithTimeout(10000);
  }

  async _startListening() {
    return new Promise((resolve) => {
      this._wss = new WebSocket.Server({
        port: this._options.port,
        perMessageDeflate: {}
      }, () => resolve());

      this._wss.on('connection', this._onConnection);
    });
  }

  /**
   * @param {WebSocket} ws
   * @param {IncomingMessage} req
   */
  _onConnection(ws, req) {
    this._sessionManager.registerConnection(ws, req.socket);
  }

  _closeWithTimeout(timeoutValue) {
    return new Promise((resolve) => {
      const handle = setTimeout(() => {
        log.warn({ event: 'TIMEOUT' }, 'Detox server closed ungracefully on a timeout!!!');
        resolve();
      }, timeoutValue);

      this._wss.close(() => {
        log.debug({ event: 'WS_CLOSE' }, 'Detox server connections terminated gracefully');
        clearTimeout(handle);
        resolve();
      });
    });
  }
}

module.exports = DetoxServer;
