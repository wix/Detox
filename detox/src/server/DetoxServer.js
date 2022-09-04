// @ts-nocheck
const _ = require('lodash');
const WebSocket = require('ws');

const { DetoxInternalError, DetoxRuntimeError } = require('../errors');
const Deferred = require('../utils/Deferred');
const log = require('../utils/logger').child({ cat: 'ws-server,ws' });

const DetoxSessionManager = require('./DetoxSessionManager');

class DetoxServer {
  /**
   * @param {number} options.port
   * @param {boolean} options.standalone
   */
  constructor(options) {
    this._onConnection = this._onConnection.bind(this);
    this._onError = this._onError.bind(this);

    this._options = _.defaults(options, {
      Server: WebSocket.Server,
    });

    this._sessionManager = new DetoxSessionManager();

    this._wss = null;
    this._opening = null;
    this._closing = null;
  }

  get port() {
    if (!this._wss) {
      throw new DetoxInternalError('Cannot get a port of a closed WebSocket server');
    }

    return this._wss.address().port;
  }

  async open() {
    await this._startListening();

    const level = this._options.standalone ? 'info' : 'debug';
    log[level](`Detox server listening on localhost:${this.port}...`);
  }

  async close() {
    try {
      await this._closeWithTimeout(10000);
      log.debug('Detox server has been closed gracefully');
    } catch (err) {
      log.warn({ err },
        `Detox server has been closed abruptly! See the error details below:`
      );
    }
  }

  async _startListening() {
    const opening = this._opening = new Deferred();

    this._wss = new this._options.Server({
      port: this._options.port,
      perMessageDeflate: {}
    }, () => {
      this._opening.resolve();
      this._opening = null;
    });

    this._wss.on('connection', this._onConnection);
    this._wss.on('error', this._onError);

    return opening.promise;
  }

  /**
   * @param {WebSocket} ws
   * @param {IncomingMessage} req
   */
  _onConnection(ws, req) {
    this._sessionManager.registerConnection(ws, req.socket);
  }

  /**
   * @param {Error} err
   */
  _onError(err) {
    if (this._opening) {
      this._opening.reject(err);
    } else if (this._closing) {
      this._closing.reject(err);
    } else {
      log.error({ err }, 'Detox server has got an unhandled error:');
    }
  }

  _closeWithTimeout(timeoutValue) {
    if (!this._wss) {
      return;
    }

    const closing = this._closing = new Deferred();

    const handle = setTimeout(() => {
      this._closing.reject(new DetoxRuntimeError({
        message: `Detox server close callback was not invoked within the ${timeoutValue} ms timeout`,
      }));
      this._unlinkServer();
    }, timeoutValue);

    try {
      this._wss.close(() => {
        clearTimeout(handle);
        this._closing.resolve();
        this._unlinkServer();
      });
    } catch (e) {
      this._closing.reject(e);
      this._unlinkServer();
    }

    return closing.promise;
  }

  _unlinkServer() {
    this._wss = null;
    this._opening = null;
    this._closing = null;
  }
}

module.exports = DetoxServer;
