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
    this.pandingAppCrash;

    this.setActionListener(new actions.AppWillTerminateWithError(), (response) => {
      this.pandingAppCrash = response.params.errorDetails;
      this.ws.rejectAll(this.pandingAppCrash);
    });
  }

  async connect() {
    await this.ws.open();
    await this.sendAction(new actions.Login(this.configuration.sessionId));
  }

  async reloadReactNative() {
    await this.sendAction(new actions.ReloadReactNative());
  }

  async waitUntilReady() {
    await this.sendAction(new actions.Ready());
    this.isConnected = true;
  }

  async cleanup() {
    clearTimeout(this.slowInvocationStatusHandler);
    if (this.isConnected && !this.pandingAppCrash) {
      if(this.ws.isOpen()) {
        await this.sendAction(new actions.Cleanup(this.successfulTestRun));
      }
      this.isConnected = false;
    }

    if (this.ws.isOpen()) {
      await this.ws.close();
    }
  }

  async currentStatus() {
    await this.sendAction(new actions.CurrentStatus());
  }

  async shake() {
    await this.sendAction(new actions.Shake());
  }

  async deliverPayload(params) {
    await this.sendAction(new actions.DeliverPayload(params));
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }

    if (this.slowInvocationTimeout) {
      this.slowInvocationStatusHandler = this.slowInvocationStatus();
    }

    // when this test run fails, we want a stack trace from up here where the
    // $callee is still available, and not inside the catch block where it isn't
    const potentialError = new Error();

    try {
      await this.sendAction(new actions.Invoke(invocation));
    } catch (err) {
      this.successfulTestRun = false;
      potentialError.message = err;
      throw potentialError;
    }
    clearTimeout(this.slowInvocationStatusHandler);
  }

  getPendingCrashAndReset() {
    const crash = this.pandingAppCrash;
    this.pandingAppCrash = undefined;

    return crash;
  }

  setActionListener(action, clientCallback) {
    this.ws.setEventCallback(action.messageId, (response) => {
      const parsedResponse = JSON.parse(response);
      action.handle(parsedResponse);

      /* istanbul ignore next */
      if (clientCallback) {
        clientCallback(parsedResponse);
      }
    });
  }

  async sendAction(action) {
    const response = await this.ws.send(action, action.messageId);
    const parsedResponse = JSON.parse(response);
    await action.handle(parsedResponse);
    return parsedResponse;
  }

  slowInvocationStatus() {
    return setTimeout(async () => {
      if (this.ws.isOpen()) {
        const status = await this.currentStatus();
        this.slowInvocationStatusHandler = this.slowInvocationStatus();
      }
    }, this.slowInvocationTimeout);
  }
}

module.exports = Client;
