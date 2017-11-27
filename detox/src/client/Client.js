const AsyncWebSocket = require('./AsyncWebSocket');
const actions = require('./actions/actions');
const argparse = require('../utils/argparse');

class Client {
  constructor(config) {
    this.isConnected = false;
    this.configuration = config;
    this.ws = new AsyncWebSocket(config.server);
    this.slowInvocationStatusHandler = null;
    this.slowInvocationTimeout = argparse.getArgValue('debug-synchronization');
    this.successfulTestRun = true; // flag for cleanup
  }

  async connect() {
    await this.ws.open();
    await this.sendAction(new actions.Login(this.configuration.sessionId));
  }

  async reloadReactNative() {
    await this.sendAction(new actions.ReloadReactNative(), -1000);
  }

  async sendUserNotification(params) {
    await this.sendAction(new actions.SendUserNotification(params));
  }

  async waitUntilReady() {
    await this.sendAction(new actions.Ready(), -1000);
    this.isConnected = true;
  }

  async cleanup() {
    clearTimeout(this.slowInvocationStatusHandler);

    if (this.isConnected) {
      await this.sendAction(new actions.Cleanup(this.successfulTestRun));
      this.isConnected = false;
    }

    if (this.ws.isOpen()) {
      await this.ws.close();
    }
  }

  async currentStatus() {
    await this.sendAction(new actions.CurrentStatus());
  }

  async openURL(params) {
    await this.sendAction(new actions.openURL(params));
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }

    if (this.slowInvocationTimeout) {
      this.slowInvocationStatusHandler = this.slowInvocationStatus();
    }
    try {
      await this.sendAction(new actions.Invoke(invocation));
    } catch (err) {
      this.successfulTestRun = false;
      throw new Error(err);
    }
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
      this.slowInvocationStatusHandler = this.slowInvocationStatus();
    }, this.slowInvocationTimeout);
  }
}

module.exports = Client;
