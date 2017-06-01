const AsyncWebSocket = require('./AsyncWebSocket');
const actions = require('./actions/actions');

class Client {
  constructor(config) {
    this.configuration = config;
    this.ws = new AsyncWebSocket(config.server);
  }

  async connect() {
    await this.ws.open();
    this.sendAction(new actions.Login(this.configuration.sessionId));
  }

  async reloadReactNative() {
    await this.sendAction(new actions.ReloadReactNative(), -1000);
  }

  async sendUserNotification(params) {
    await this.sendAction(new actions.SendUserNotification(params));
  }

  async waitUntilReady() {
    await this.sendAction(new actions.Ready(), -1000);
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
    await this.sendAction(new actions.Invoke(invocation));
  }

  async sendAction(action, messageId) {
    const response = await this.ws.send(action, messageId);
    await action.handle(JSON.parse(response));
    return response;
  }
}

module.exports = Client;
