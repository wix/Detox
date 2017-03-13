const log = require('npmlog');
const WebSocket = require('ws');

class AsyncWebSocket {

  constructor(url) {
    this.url = url;
    this.ws = undefined;
    this.inFlightPromise = {};
  }

  async open() {
    return new Promise(async (resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = (response) => {
        log.verbose(`ws`, `onOpen ${response}`);
        resolve(response);
      };

      this.ws.onerror = (error) => {
        log.error(`ws`, `onError: ${error}`);
        this.inFlightPromise.reject(error);
      };

      this.ws.onmessage = (response) => {
        log.verbose(`ws`, `onMessage: ${response.data}`);
        this.inFlightPromise.resolve(response.data);
      };

      this.inFlightPromise.resolve = resolve;
      this.inFlightPromise.reject = reject;
    });
  }

  async send(message) {
    if (!this.ws) {
      throw new Error(`Can't send a message on a closed websocket, init the by calling 'open()'`);
    }

    return new Promise(async (resolve, reject) => {
      log.verbose(`ws`, `send: ${message}`);
      this.inFlightPromise.resolve = resolve;
      this.inFlightPromise.reject = reject;
      this.ws.send(message);
    });
  }

  async close() {
    return new Promise(async (resolve, reject) => {
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
