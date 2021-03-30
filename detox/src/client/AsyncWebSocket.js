const _ = require('lodash');
const WebSocket = require('ws');
const log = require('../utils/logger').child({ __filename });
const Deferred = require('../utils/Deferred');
const DetoxInvariantError = require('../errors/DetoxInvariantError');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const EVENTS = {
  OPEN: Object.freeze({ event: 'OPEN' }),
  ERROR: Object.freeze({ event: 'ERROR' }),
  MESSAGE: Object.freeze({ event: 'MESSAGE' }),
  SEND: Object.freeze({ event: 'SEND' }),
};

class AsyncWebSocket {
  constructor(url) {
    this._log = log.child({ url });
    this._url = url;
    this._ws = null;
    this._eventCallbacks = {};
    this._messageIdCounter = 0;
    this._opening = null;
    this._closing = null;

    this.inFlightPromises = {};
  }

  async open() {
    if (this._ws) {
      throw new DetoxInvariantError(`Cannot open an already ${this.status} web socket.`);
    }

    this._opening = new Deferred();

    try {
      this._ws = new WebSocket(this._url);
      this._ws.onopen = this._onOpen.bind(this);
      this._ws.onerror = this._onError.bind(this);
      this._ws.onmessage = this._onMessage.bind(this);
      this._ws.onclose = this._onClose.bind(this);
    } catch (e) {
      this._unlinkSocket();

      throw new DetoxRuntimeError({
        message: 'Unexpected error occurred when opening a web socket connection.\nSee the error details below.',
        hint: DetoxInvariantError.reportIssue,
        debugInfo: e,
      });
    }

    return this._opening.promise;
  }

  async close() {
    if (!this._ws) {
      return;
    }

    if (this._closing) {
      throw new DetoxInvariantError('Detected an attempt to close an already closing or closed web socket.');
    }

    const closing = this._closing = new Deferred();

    try {
      this._ws.close();
    } catch (error) {
      this._onError({ error });
    }

    return closing.promise;
  }

  async send(message) {
    if (!this.isOpen) {
      throw new DetoxRuntimeError({
        message: 'Cannot send a message over the closed web socket. See the payload below:',
        hint: DetoxInvariantError.reportIssue,
        debugInfo: message,
      });
    }

    if (!_.isNumber(message.messageId)) {
      message.messageId = this._messageIdCounter++;
    }

    const messageId = message.messageId;
    const inFlight = this.inFlightPromises[messageId] = new Deferred();
    inFlight.message = message;

    const messageAsString = JSON.stringify(message);
    this._log.trace(EVENTS.SEND, messageAsString);
    this._ws.send(messageAsString);

    return inFlight.promise;
  }

  setEventCallback(event, callback) {
    if (_.isEmpty(this._eventCallbacks[event])) {
      this._eventCallbacks[event] = [callback];
    } else {
      this._eventCallbacks[event].push(callback);
    }
  }

  resetInFlightPromises() {
    for (const messageId of _.keys(this.inFlightPromises)) {
      delete this.inFlightPromises[messageId];
    }
  }

  rejectAll(error) {
    for (const messageId of _.keys(this.inFlightPromises)) {
      const deferred = this.inFlightPromises[messageId];
      deferred.reject(error);
      delete this.inFlightPromises[messageId];
    }
  }

  get isOpen() {
    return this.status === 'open';
  }

  get status() {
    if (!this._ws) {
      return 'non-initialized';
    }

    switch (this._ws.readyState) {
      case WebSocket.CLOSED: return 'closed';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CONNECTING: return 'opening';
      case WebSocket.OPEN: return 'open';
    }
  }

  /**
   * @param {WebSocket.OpenEvent} event
   * @private
   */
  _onOpen(event) {
    this._log.trace(EVENTS.OPEN, `opened web socket to: ${this._url}`);
    this._opening.resolve();
    this._opening = null;
  }

  /**
   * @param {Error} event.error
   * @private
   */
  _onError(event) {
    const { error } = event;

    if (this._opening && this._opening.isPending()) {
      this._opening.reject(new DetoxRuntimeError({
        message: 'Failed to open a connection to the Detox server.',
        debugInfo: error,
        noStack: true,
      }));

      return this._unlinkSocket();
    }

    if (this._closing && this._closing.isPending()) {
      this._closing.reject(new DetoxRuntimeError({
        message: 'Failed to close a connection to the Detox server.',
        debugInfo: error,
        noStack: true,
      }));

      return this._unlinkSocket();
    }

    this._handleError(new DetoxRuntimeError({
      message: 'Failed to deliver the message to the Detox server:',
      debugInfo: error,
      noStack: true,
    }));
  }

  _handleError(error) {
    if (_.size(this.inFlightPromises) > 0) {
      return this.rejectAll(error);
    }

    // TODO: DetoxRuntimeError.format(error)
    log.error(EVENTS.ERROR, '%s', error);
  }

  /**
   *
   * @param {WebSocket.MessageEvent} event
   * @private
   */
  _onMessage(event) {
    const data = event && event.data || null;

    try {
      this._log.trace(EVENTS.MESSAGE, data);

      const json = JSON.parse(data);
      if (!json || !json.type) {
        throw new DetoxRuntimeError('Empty or non-typed message received over the web socket.');
      }

      if (this.inFlightPromises.hasOwnProperty(json.messageId)) {
        this.inFlightPromises[json.messageId].resolve(json);
        delete this.inFlightPromises[json.messageId];
      } else if (this._eventCallbacks.hasOwnProperty(json.type)) {
        for (const callback of this._eventCallbacks[json.type]) callback(json);
      } else {
        throw new DetoxRuntimeError('Unexpected message received over the web socket: ' + json.type)
      }
    } catch (error) {
      this._handleError(new DetoxRuntimeError({
        message: 'Unexpected error on an attempt to handle a message over the web socket.',
        hint: 'Examine the inner error:\n\n' + DetoxRuntimeError.format(error) + '\n\nThe payload was:',
        debugInfo: data,
      }));
    }
  }

  /**
   * @param {WebSocket.CloseEvent | null} event
   * @private
   */
  _onClose(event) {
    if (this._closing) {
      this._closing.resolve();
    }

    this._unlinkSocket();
  }

  _unlinkSocket() {
    if (this._ws) {
      this._ws.onopen = null;
      this._ws.onerror = null;
      this._ws.onmessage = null;
      this._ws.onclose = null;
      this._ws = null;
    }

    this._opening = null;
    this._closing = null;
  }
}

module.exports = AsyncWebSocket;
