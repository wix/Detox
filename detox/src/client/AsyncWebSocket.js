const _ = require('lodash');
const util = require('util');
const log = require('../utils/logger').child({ __filename, class: 'AsyncWebSocket' });
const WebSocket = require('ws');

class AsyncWebSocket {

  constructor(url) {
    this.log = log.child({ url });
    this.url = url;
    this.ws = undefined;
    this.inFlightPromises = {};
    this.eventCallbacks = {};
    this.messageIdCounter = 0;
  }

  async open() {
    return new Promise(async(resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = (response) => {
        this.log.debug({ event: 'WEBSOCKET_OPEN' }, `opened web socket to: ${this.url}`);
        resolve(response);
      };

      this.ws.onerror = (err) => {
        this.log.error({ event: 'WEBSOCKET_ERROR', err }, `caught error: ${err}`);

        if (_.size(this.inFlightPromises) === 1) {
          _.values(this.inFlightPromises)[0].reject(err);
          this.inFlightPromises = {};
        } else {
          throw err;
        }
      };

      this.ws.onmessage = (response) => {
        this.log.trace({ event: 'WEBSOCKET_MESSAGE' }, `${response.data}`);

        let messageId = JSON.parse(response.data).messageId;
        let pendingPromise = this.inFlightPromises[messageId];
        if (pendingPromise) {
          pendingPromise.resolve(response.data);
          delete this.inFlightPromises[messageId];
        }
        let eventCallback = this.eventCallbacks[messageId];
        if (eventCallback) {
          eventCallback(response.data);
        }
      };

      this.inFlightPromises[this.messageIdCounter] = {resolve, reject};
    });
  }

  async send(message, messageId) {
    if (!this.ws) {
      throw new Error(`Can't send a message on a closed websocket, init the by calling 'open()'. Message:  ${JSON.stringify(message)}`);
    }

    return new Promise(async(resolve, reject) => {
      message.messageId = messageId || this.messageIdCounter++;
      this.inFlightPromises[message.messageId] = {message, resolve, reject};
      const messageAsString = JSON.stringify(message);
      this.log.trace({ event: 'WEBSOCKET_SEND' }, `${messageAsString}`);
      this.ws.send(messageAsString);
    });
  }

  setEventCallback(eventId, callback) {
    this.eventCallbacks[eventId] = callback;
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        this.ws.onclose = (message) => {
          this.ws = null;
          resolve(message);
        };

        if (this.ws.readyState !== WebSocket.CLOSED) {
          this.ws.close();
        } else {
          this.ws.onclose();
        }
      } else {
        reject(new Error(`websocket is closed, init the by calling 'open()'`));
      }
    });
  }

  isOpen() {
    if (!this.ws) {
      return false;
    }
    return this.ws.readyState === WebSocket.OPEN;
  }

  resetInFlightPromises() {
    _.forEach(this.inFlightPromises, (_, messageId) => {
      delete this.inFlightPromises[messageId];
    });
  }

  rejectAll(error) {
    _.forEach(this.inFlightPromises, (promise, messageId) => {
      let pendingPromise = this.inFlightPromises[messageId];
      pendingPromise.reject(error);
      delete this.inFlightPromises[messageId];
    });
  }
}

module.exports = AsyncWebSocket;
