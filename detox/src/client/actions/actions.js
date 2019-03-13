const _ = require('lodash');
const log = require('../../utils/logger').child({ __filename });

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

class WaitForBackground extends Action {
  constructor() {
    super('waitForBackground');
  }

  async handle(response) {
    this.expectResponseOfType(response, 'waitForBackgroundDone');
  }
}

class WaitForActive extends Action {
  constructor() {
    super('waitForActive');
  }

  async handle(response) {
    this.expectResponseOfType(response, 'waitForActiveDone');
  }
}

class Shake extends Action {
  constructor() {
    super('shakeDevice');
  }

  async handle(response) {
    this.expectResponseOfType(response, 'shakeDeviceDone');
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

class DeliverPayload extends Action {
  constructor(params) {
    super('deliverPayload', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'deliverPayloadDone');
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
      log.info({ class: 'CurrentStatus' }, `Sync ${resource.name}: ${resource.info.prettyPrint}`);
    });
    return response;
  }
}

class SetInstrumentsRecordingState extends Action {
  constructor(params) {
    super('setRecordingState', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setRecordingStateDone');
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
  WaitForBackground,
  WaitForActive,
  Ready,
  Invoke,
  ReloadReactNative,
  Cleanup,
  DeliverPayload,
  CurrentStatus,
  Shake,
  SetInstrumentsRecordingState,
  AppWillTerminateWithError
};
