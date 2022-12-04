// @ts-nocheck
const { DetoxInternalError, DetoxRuntimeError } = require('../../errors');
const logger = require('../../utils/logger');
const formatJSONStatus = require('../actions/formatters/SyncStatusFormatter');

class Action {
  constructor(type, params = {}) {
    this.type = type;
    this.params = params;
    this.messageId = undefined;
  }

  expectResponseOfType(response, type) {
    if (response.type !== type) {
      throw new DetoxInternalError(`was expecting '${type}' , got ${JSON.stringify(response)}`);
    }
  }

  /** @returns {boolean} */
  get isAtomic() {
    throw new DetoxInternalError(`Action.prototype.isAtomic must be defined for ${this.type}`);
  }

  /** @returns {number} */
  get timeout() {
    throw new DetoxInternalError(`Action.prototype.timeout getter must be defined for ${this.type}`);
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

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 1000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'loginSuccess');
    return response.params;
  }
}

class Ready extends Action {
  constructor() {
    super('isReady');
    this.messageId = -1000;
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
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

  get isAtomic() {
    return false;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'ready');
  }
}

class WaitForBackground extends Action {
  constructor() {
    super('waitForBackground');
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'waitForBackgroundDone');
  }
}

class WaitForActive extends Action {
  constructor() {
    super('waitForActive');
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'waitForActiveDone');
  }
}

class Shake extends Action {
  constructor() {
    super('shakeDevice');
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'shakeDeviceDone');
  }
}

class SetOrientation extends Action {
  constructor(params) {
    super('setOrientation', params);
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setOrientationDone');
  }
}

class Cleanup extends Action {
  constructor(stopRunner) {
    super('cleanup', { stopRunner });
    this.messageId = -0xc1ea;
  }

  get isAtomic() {
    return false;
  }

  get timeout() {
    return 5000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'cleanupDone');
  }
}

class Invoke extends Action {
  constructor(params) {
    super('invoke', params);
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    switch (response.type) {
      case 'testFailed':
        let message = 'Test Failed: ' + response.params.details;
        let hint;
        let debugInfo;

        if (response.params.viewHierarchy) {
          /* istanbul ignore next */
          if (/^(debug|trace)$/.test(logger.level)) {
            debugInfo = 'View Hierarchy:\n' + response.params.viewHierarchy;
          } else {
            hint = 'To print view hierarchy on failed actions/matches, use log-level verbose or higher.';
          }
        }

        throw new DetoxRuntimeError({ message, hint, debugInfo });
      case 'invokeResult':
        return response.params;
      case 'error':
        throw new DetoxRuntimeError(response.params.error);
      default:
        throw new DetoxInternalError(`Tried to invoke an action on app, got an unsupported response: ${JSON.stringify(response)}`);
    }
  }
}

class DeliverPayload extends Action {
  constructor(params) {
    super('deliverPayload', params);
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'deliverPayloadDone');
  }
}

class SetSyncSettings extends Action {
  constructor(params) {
    super('setSyncSettings', params);
  }

  get isAtomic() {
    return true;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setSyncSettingsDone');
  }
}

class CurrentStatus extends Action {
  constructor(params) {
    super('currentStatus', params);
  }

  get isAtomic() {
    return false;
  }

  get timeout() {
    return 5000;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'currentStatusResult');
    return formatJSONStatus(response.params.status);
  }
}

class SetInstrumentsRecordingState extends Action {
  constructor(params) {
    super('setRecordingState', params);
  }

  get isAtomic() {
    return false;
  }

  get timeout() {
    return 0;
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setRecordingStateDone');
  }
}

class CaptureViewHierarchy extends Action {
  constructor(params) {
    super('captureViewHierarchy', params);
  }

  get isAtomic() {
    return false;
  }

  get timeout() {
    return 0;
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
