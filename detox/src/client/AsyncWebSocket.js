const _ = require('lodash');
const WebSocket = require('ws');

const DetoxInternalError = require('../errors/DetoxInternalError');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const Deferred = require('../utils/Deferred');
const log = require('../utils/logger').child({ __filename });

const InflightRequest = require('./InflightRequest');

const EVENTS = {
  OPEN: Object.freeze({ event: 'WS_OPEN' }),
  ERROR: Object.freeze({ event: 'WS_ERROR' }),
  MESSAGE: Object.freeze({ event: 'WS_MESSAGE' }),
  SEND: Object.freeze({ event: 'WS_SEND' }),
  LATE_RESPONSE: Object.freeze({ event: 'WS_LATE_RESPONSE' }),
};

const DEFAULT_SEND_OPTIONS = {
  timeout: 0,
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
    this._abortedMessageIds = new Set();

    this.inFlightPromises = {};
  }

  async open() {
    if (this._ws) {
      throw new DetoxInternalError(`Cannot open an already ${this.status} web socket.`);
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
        hint: DetoxRuntimeError.reportIssue,
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
      throw new DetoxInternalError('Detected an attempt to close an already closing or closed web socket.');
    }

    const closing = this._closing = new Deferred();

    try {
      this._ws.close();
    } catch (error) {
      this._onError({ error });
    }

    return closing.promise;
  }

  async send(message, options = DEFAULT_SEND_OPTIONS) {
    if (!this.isOpen) {
      throw new DetoxRuntimeError({
        message: 'Cannot send a message over the closed web socket. See the payload below:',
        hint: DetoxRuntimeError.reportIssue,
        debugInfo: message,
      });
    }

    if (!_.isNumber(message.messageId)) {
      message.messageId = this._messageIdCounter++;
    }

    const messageId = message.messageId;
    const inFlight = this.inFlightPromises[messageId] = new InflightRequest(message).withTimeout(options.timeout);

    this.handleMultipleNonAtomicPendingActions();

    const messageAsString = JSON.stringify(message);
    this._log.trace(EVENTS.SEND, messageAsString);
    this._ws.send(messageAsString);

    return inFlight.promise;
  }

  handleMultipleNonAtomicPendingActions() {
    const pendingNonAtomicRequests = this.getNonAtomicPendingActions();
    for (const inflight of pendingNonAtomicRequests) {
        inflight.reject(new DetoxRuntimeError({
          message: 'Detox has detected multiple interactions taking place simultaneously. Have you forgotten to apply an await over one of the Detox actions in your test code?',
        }));
    }
  }

  getNonAtomicPendingActions() {
    const remaining = Object.keys(this.inFlightPromises).map((key) => {
      return this.inFlightPromises[key];
    }).filter(item => {
      return item.message.isAtomic === true;
    });

    return remaining.length > 1 ? remaining : [];
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
      const inFlight = this.inFlightPromises[messageId];
      inFlight.clearTimeout();
      delete this.inFlightPromises[messageId];
      this._abortedMessageIds.add(+messageId);
    }
  }

  // TODO: handle this leaked abstraction some day
  hasPendingActions() {
    return _.some(this.inFlightPromises, p => p.message.type !== 'currentStatus');
  }

  rejectAll(error) {
    const hasPendingActions = this.hasPendingActions();
    const inFlightPromises = _.values(this.inFlightPromises);

    this.resetInFlightPromises();
    for (const inflight of inFlightPromises) {
      inflight.reject(error);
    }

    if (!hasPendingActions) {
      log.error(EVENTS.ERROR, DetoxRuntimeError.format(error));
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
  _onOpen(event) { // eslint-disable-line no-unused-vars
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

    this.rejectAll(new DetoxRuntimeError({
      message: 'Failed to deliver the message to the Detox server:',
      debugInfo: error,
      noStack: true,
    }));
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

      let handled = false;

      if (this.inFlightPromises.hasOwnProperty(json.messageId)) {
        this.inFlightPromises[json.messageId].resolve(json);
        delete this.inFlightPromises[json.messageId];
        handled = true;
      }

      if (this._eventCallbacks.hasOwnProperty(json.type)) {
        for (const callback of this._eventCallbacks[json.type]) {
          callback(json);
        }

        handled = true;
      }

      if (!handled) {
        if (this._abortedMessageIds.has(json.messageId)) {
          log.debug(EVENTS.LATE_RESPONSE, `Received late response for messageId=${json.messageId}`);
        } else {
          throw new DetoxRuntimeError('Unexpected message received over the web socket: ' + json.type);
        }
      }
    } catch (error) {
      this.rejectAll(new DetoxRuntimeError({
        message: 'Unexpected error on an attempt to handle the response received over the web socket.',
        hint: 'Examine the inner error:\n\n' + DetoxRuntimeError.format(error) + '\n\nThe payload was:',
        debugInfo: data,
      }));
    }
  }

  /**
   * @param {WebSocket.CloseEvent | null} event
   * @private
   */
  _onClose(event) { // eslint-disable-line no-unused-vars
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
