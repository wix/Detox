const AsyncWebSocket = require('./AsyncWebSocket');
const actions = require('./actions/actions');
//const Queue = require('../commons/dataStructures').Queue;

class Client {
  constructor(config) {
    this.configuration = config;
    this.ws = new AsyncWebSocket(config.server);
    //this.messageCounter = 0;
    this.invocationId = 0;
  }

  async connect() {
    await this.ws.open();
    return await this.sendAction(new actions.Login(this.configuration.sessionId));
  }

  async reloadReactNative() {
    await this.sendAction(new actions.ReloadReactNative());
  }

  async sendUserNotification(params) {
    await this.sendAction(new actions.SendUserNotification(params));
  }

  async waitUntilReady() {
    await this.sendAction(new actions.Ready())
  }

  async cleanup() {
    if (this.ws.isOpen()) {
      await this.sendAction(new actions.Cleanup());
    }
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }
    const id = this.invocationId++;
    invocation.id = id.toString();
    await this.sendAction(new actions.Invoke(invocation));
  }

  async sendAction(action) {
    return await this.ws.send(JSON.stringify(action));
  }
}

module.exports = Client;