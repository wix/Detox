const _ = require('lodash');
const log = require('npmlog');
const WebSocket = require('ws');

class AsyncWebSocket {

  constructor(url) {
    this.url = url;
    this.ws = undefined;
    this.inFlightPromises = {};
    this.messageIdCounter = 0;
  }

  async open() {
    return new Promise(async(resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = (response) => {
        log.verbose(`ws`, `onOpen ${response}`);
        resolve(response);
      };

      this.ws.onerror = (error) => {
        log.error(`ws`, `onError: ${error}`);

        if (_.size(this.inFlightPromises) === 1) {
          _.values(this.inFlightPromises)[0].reject(error);
          this.inFlightPromises = {};
        } else {
          throw error;
        }
      };

      this.ws.onmessage = (response) => {
        log.verbose(`ws`, `onMessage: ${response.data}`);
        let pendingId = JSON.parse(response.data).messageId;
        let pendingPromise = this.inFlightPromises[pendingId];
        if (pendingPromise) {
          pendingPromise.resolve(response.data);
          delete this.inFlightPromises[pendingId];
        }
      };

      this.inFlightPromises[this.messageIdCounter] = {resolve, reject};
    });
  }

  async send(message, messageId) {
    if (!this.ws) {
      throw new Error(`Can't send a message on a closed websocket, init the by calling 'open()'`);
    }

    return new Promise(async(resolve, reject) => {
      message.messageId = messageId || this.messageIdCounter++;
      this.inFlightPromises[message.messageId] = {resolve, reject};
      const messageAsString = JSON.stringify(message);
      log.verbose(`ws`, `send: ${messageAsString}`);
      this.ws.send(messageAsString);
    });
  }

  async close() {
    return new Promise(async(resolve, reject) => {
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
}

module.exports = AsyncWebSocket;
