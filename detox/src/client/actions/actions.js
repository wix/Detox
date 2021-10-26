const DetoxInternalError = require('../../errors/DetoxInternalError');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const { getDetoxLevel } = require('../../utils/logger');

class Action {
  constructor(type, params = {}) {
    this.type = type;
    this.sendTimeout = params.sendTimeout;
    this.canBeConcurrent = params.canBeConcurrent;
    this.params = params;
    this.messageId = undefined;
  }

  expectResponseOfType(response, type) {
    if (response.type !== type) {
      throw new DetoxInternalError(`was expecting '${type}' , got ${JSON.stringify(response)}`);
    }
  }

  getCanBeConcurrent() {
    if (this.canBeConcurrent === undefined) {
      throw new DetoxInternalError(`canBeConcurrent must be defined for ${this.type}`);
    }

    return this.canBeConcurrent;
  }

  getTimeout() {
    if (this.sendTimeout === undefined) {
      throw new DetoxInternalError(`sendTimeout must be defined for ${this.type}`);
    }

    return this.sendTimeout;
  }
}

class Login extends Action {
  constructor(sessionId) {
    const params = {
      sessionId: sessionId,
      role: 'tester'
    };
      super('login', { sendTimeout: 1000, canBeConcurrent: false, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'loginSuccess');
    return response.params;
  }
}

class Ready extends Action {
  constructor() {
    super('isReady', { sendTimeout: 0, canBeConcurrent: false });
    this.messageId = -1000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class ReloadReactNative extends Action {
  constructor() {
    super('reactNativeReload', { sendTimeout: 0, canBeConcurrent: true });
    this.messageId = -1000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class WaitForBackground extends Action {
  constructor() {
    super('waitForBackground', { sendTimeout: 0, canBeConcurrent: false });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'waitForBackgroundDone');
  }
}

class WaitForActive extends Action {
  constructor() {
    super('waitForActive', { sendTimeout: 0, canBeConcurrent: false });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'waitForActiveDone');
  }
}

class Shake extends Action {
  constructor() {
    super('shakeDevice', { sendTimeout: 0, canBeConcurrent: false });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'shakeDeviceDone');
  }
}

class SetOrientation extends Action {
  constructor(params) {
    super('setOrientation', { sendTimeout: 0, canBeConcurrent: false, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setOrientationDone');
  }
}

class Cleanup extends Action {
  constructor(stopRunner) {
    super('cleanup', { sendTimeout: 5000, canBeConcurrent: true, stopRunner });
    this.messageId = -0xc1ea;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'cleanupDone');
  }
}

class Invoke extends Action {
  constructor(params) {
    super('invoke', { sendTimeout: 0, canBeConcurrent: false, ...params });
  }

  async handle(response) {
    switch (response.type) {
      case 'testFailed':
        let message = 'Test Failed: ' + response.params.details;
        if (response.params.viewHierarchy) {
          /* istanbul ignore next */
          message += /^(debug|trace)$/.test(getDetoxLevel())
            ? '\nView Hierarchy:\n' + response.params.viewHierarchy
            : '\nTIP: To print view hierarchy on failed actions/matches, use log-level verbose or higher.';
        }

        throw new Error(message);
      case 'invokeResult':
        return response.params;
      case 'error':
        throw new Error(response.params.error);
      default:
        throw new DetoxInternalError(`Tried to invoke an action on app, got an unsupported response: ${JSON.stringify(response)}`);
    }
  }
}

class DeliverPayload extends Action {
  constructor(params) {
    super('deliverPayload', { sendTimeout: 0, canBeConcurrent: false, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'deliverPayloadDone');
  }
}

class SetSyncSettings extends Action {
  constructor(params) {
    super('setSyncSettings', { sendTimeout: 0, canBeConcurrent: false, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setSyncSettingsDone');
  }
}

class CurrentStatus extends Action {
  constructor(params) {
    super('currentStatus', { sendTimeout: 5000, canBeConcurrent: true, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'currentStatusResult');
    return response.params.status;
  }
}

class SetInstrumentsRecordingState extends Action {
  constructor(params) {
    super('setRecordingState', { sendTimeout: 0, canBeConcurrent: true, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setRecordingStateDone');
  }
}

class CaptureViewHierarchy extends Action {
  constructor(params) {
    super('captureViewHierarchy', { sendTimeout: 0, canBeConcurrent: true, ...params });
  }

  async handle(response) {
    this.expectResponseOfType(response, 'captureViewHierarchyDone');

    const { captureViewHierarchyError } = response.params;
    if (captureViewHierarchyError) {
      throw new DetoxRuntimeError({
        message: 'Failed to capture view hierarchy. Reason:\n',
        debugInfo: captureViewHierarchyError,
      });
    }

    return response;
  }
}

module.exports = {
  Action,
  Login,
  WaitForBackground,
  WaitForActive,
  Ready,
  Invoke,
  ReloadReactNative,
  Cleanup,
  DeliverPayload,
  SetSyncSettings,
  CurrentStatus,
  Shake,
  SetOrientation,
  SetInstrumentsRecordingState,
  CaptureViewHierarchy,
};
