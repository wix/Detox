class AsyncWebSocket {

  constructor() {
    this.isOpen = false;
  }
  async open() {
    this.isOpen = true;
    return new Promise(async (resolve, reject) => {
      resolve('bah');
    });
  }

  async send(message) {
    return new Promise(async (resolve, reject) => {
      resolve('response');
    });
  }

  async close() {
    this.isOpen = false;
    return new Promise(async (resolve, reject) => {
      resolve('closed');
    });
  }

  async isOpen() {
    return this.isOpen;
  }
}

module.exports = AsyncWebSocket;
