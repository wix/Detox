const WebSocket = require('ws');

class AsyncWebSocket {

  constructor(url) {
    this.url = url;
    this.ws = undefined;
  }

  async open() {
    return new Promise(async (resolve, reject) => {

      this.ws = new WebSocket(this.url);
      this.ws.on('open', (response) => {
        resolve(response);
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  async send(message) {

    if (!this.ws) {
      throw new Error(`Can't send a message on a closed websocket, init the by calling 'open()'`)
    }

    return new Promise(async (resolve, reject) => {
      this.ws.send(message);
      this.ws.on('message', (message) => {
        resolve(message);
      });

      this.ws.on('error', (error) => {
        reject(error);
      });
    });
  }

  async close() {
    return new Promise(async (resolve, reject) => {
      if (this.ws) {
        this.ws.on('close', (message) => {
          this.ws = null;
          resolve(message);
        });

        if (this.ws.readyState !== WebSocket.CLOSED) {
          this.ws.close();
        }
        else {
          this.ws.onclose();
        }
      }
      else {
        reject(new Error(`websocket is closed, init the by calling 'open()'`));
      }
    });
  }
}

module.exports = AsyncWebSocket;
