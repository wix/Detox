const _ = require('lodash');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const logger = require('../utils/logger').child({ cat: 'ws-server,ws' });

const AnonymousConnectionHandler = require('./handlers/AnonymousConnectionHandler');

class DetoxConnection {
  /**
   * @param {{
   *   sessionManager: import('./DetoxSessionManager');
   *   webSocket: import('ws');
   *   socket: import('net').Socket;
   * }} config
   */
  constructor({ sessionManager, webSocket, socket }) {
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);
    this._onClose = this._onClose.bind(this);

    this._log = logger.child({ id: socket.remotePort });
    this._log.debug.begin(`connection :${socket.localPort}<->:${socket.remotePort}`);

    this._sessionManager = sessionManager;
    this._webSocket = webSocket;
    this._webSocket.on('message', this._onMessage);
    this._webSocket.on('error', this._onError);
    this._webSocket.on('close', this._onClose);

    // eslint-disable-next-line unicorn/no-this-assignment
    const self = this;
    this._handler = new AnonymousConnectionHandler({
      api: {
        get log() { return self._log; },
        appendLogDetails: (details) => { this._log = this._log.child(details); },

        registerSession: (params) => this._sessionManager.registerSession(this, params),
        setHandler: (handler) => { this._handler = handler; },
        sendAction: (action) => this.sendAction(action),
      },
    });
  }

  sendAction(action) {
    const messageAsString = JSON.stringify(action);
    this._log.trace({ data: action }, 'send');
    this._webSocket.send(messageAsString + '\n ');
  }

  _onMessage(rawData) {
    const data = _.isString(rawData) ? rawData : rawData.toString('utf8');
    this._log.trace({ data }, 'get');

    try {
      let action;

      try {
        action = _.attempt(() => JSON.parse(data));

        if (_.isError(action)) {
          throw new DetoxRuntimeError({
            message: 'The payload received is not a valid JSON.',
            hint: DetoxRuntimeError.reportIssue,
            debugInfo: data,
          });
        }

        if (!action.type) {
          throw new DetoxRuntimeError({
            message: 'Cannot process an action without a type.',
            hint: DetoxRuntimeError.reportIssue,
            debugInfo: action,
          });
        }

        this._handler.handle(action);
      } catch (handlerError) {
        this._handler.onError(handlerError, action);
      }
    } catch (error) {
      this._log.warn({ error }, 'Caught unhandled error:');
    }
  }

  _onError(error) {
    this._log.warn({ error }, 'Caught socket error:');
  }

  _onClose() {
    this._sessionManager.unregisterConnection(this._webSocket);
    this._log.debug.end();
  }
}

module.exports = DetoxConnection;
