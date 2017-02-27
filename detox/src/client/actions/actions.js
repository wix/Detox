const log = require('npmlog');

class Action {
  constructor(type, params = {}) {
    this.type = type;
    this.params = params;
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
    this.expectResponseOfType(response, 'ready');
  }
}

class Ready extends Action {
  constructor() {
    super('isReady');
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class ReloadReactNative extends Action {
  constructor() {
    super('reactNativeReload');
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class Cleanup extends Action {
  constructor() {
    super('cleanup');
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
        break;
      case 'invokeResult':
        break;
      case 'error':
        log.error(response.params.error);
        break;
      default:
        break;
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

module.exports = {
  Login,
  Ready,
  Invoke,
  ReloadReactNative,
  Cleanup,
  SendUserNotification
};
