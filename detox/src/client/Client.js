const AsyncWebSocket = require('./AsyncWebSocket');
const actions = require('./actions/actions');
const argparse = require('../utils/argparse');

class Client {
  constructor(config) {
    this.configuration = config;
    this.ws = new AsyncWebSocket(config.server);
    this.slowInvocationStatusHandler = null;
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

  async currentStatus() {
    await this.sendAction(new actions.CurrentStatus());
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }

    if (argparse.getArgValue('debug-slow-invocations')) {
      this.slowInvocationStatusHandler = this.slowInvocationStatus();
    }
    await this.sendAction(new actions.Invoke(invocation));
    clearTimeout(this.slowInvocationStatusHandler);
  }

  async sendAction(action, messageId) {
    const response = await this.ws.send(action, messageId);
    const parsedResponse = JSON.parse(response);
    await action.handle(parsedResponse);
    return parsedResponse;
  }

  slowInvocationStatus() {
    return setTimeout(async () => {
      const status = await this.currentStatus();
      console.log(status);
      this.slowInvocationStatusHandler = this.slowInvocationStatus();
    }, argparse.getArgValue('debug-slow-invocations'));
  }

  async timeout(resolve, ms) {
    return new Promise(() => setTimeout(resolve, ms));
  }
}

module.exports = Client;
