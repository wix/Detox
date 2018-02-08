const _ = require('lodash');
const log = require('npmlog');

class Action {
  constructor(type, params = {}) {
    this.type = type;
    this.params = params;
    this.messageId;
  }

  expectResponseOfType(response, type) {
    if (response.type !== type) {
      throw new Error(`was expecting '${type}' , got ${JSON.stringify(response)}`);
    }
  }
}

class Login extends Action {
  constructor(sessionId) {
    const params = {
      sessionId: sessionId,
      role: 'tester'
    };
    super('login', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'loginSuccess');
  }
}

class Ready extends Action {
  constructor() {
    super('isReady');
    this.messageId = -1000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class ReloadReactNative extends Action {
  constructor() {
    super('reactNativeReload');
    this.messageId = -1000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class Cleanup extends Action {
  constructor(stopRunner) {
    const params = {
      stopRunner: stopRunner
    };
    super('cleanup', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'cleanupDone');
  }
}

class Invoke extends Action {
  constructor(params) {
    super('invoke', params);
  }

  async handle(response) {
    switch (response.type) {
      case 'testFailed':
        throw new Error(response.params.details);
      case 'invokeResult':
        break;
      case 'error':
        throw new Error(response.params.error);
      default:
        throw new Error(`tried to invoke an action on testee, got an unsupported response: ${JSON.stringify(response)}`);
    }
  }
}

class SendUserNotification extends Action {
  constructor(params) {
    super('userNotification', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'userNotificationDone');
  }
}

class openURL extends Action {
  constructor(params) {
    super('openURL', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'openURLDone');
  }
}

class CurrentStatus extends Action {
  constructor(params) {
    super('currentStatus', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'currentStatusResult');

    //console.log("res:" + JSON.stringify(response, null, 2));
    _.forEach(response.params.resources, (resource) => {
      log.info(`Sync`, `${resource.name}: ${resource.info.prettyPrint}`);
    });
    return response;
  }
}

class AppWillTerminateWithError extends Action {
  constructor(params) {
    super(params);
    this.messageId = -10000;
  }

  handle(response) {
    this.expectResponseOfType(response, 'AppWillTerminateWithError');
    return response.params.errorDetails;
  }
}

module.exports = {
  Login,
  Ready,
  Invoke,
  ReloadReactNative,
  Cleanup,
  openURL,
  SendUserNotification,
  CurrentStatus,
  AppWillTerminateWithError
};
