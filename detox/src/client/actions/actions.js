const SyncStatusFormatter = require('../../client/actions/SyncStatusFormatter');
const DetoxInternalError = require('../../errors/DetoxInternalError');
const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const { getDetoxLevel } = require('../../utils/logger');

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
    return response.params;
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

class SetOrientation extends Action {
  constructor(params) {
    super('setOrientation', params);
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
    super('deliverPayload', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'deliverPayloadDone');
  }
}

class SetSyncSettings extends Action {
  constructor(params) {
    super('setSyncSettings', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'setSyncSettingsDone');
  }
}

class CurrentStatus extends Action {
  constructor(params) {
    super('currentStatus', params);
  }

  async handle(response) {
    this.expectResponseOfType(response, 'currentStatusResult');
    return SyncStatusFormatter.formatJSONStatus(response.params.status);
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

class CaptureViewHierarchy extends Action {
  constructor(params) {
    super('captureViewHierarchy', params);
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
