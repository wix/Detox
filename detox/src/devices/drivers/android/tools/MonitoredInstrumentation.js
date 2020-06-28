const _ = require('lodash');
const Instrumentation = require('./Instrumentation');
const { InstrumentationLogsParser } = require('./InstrumentationLogsParser');
const Deferred = require('../../../../utils/Deferred');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');

class MonitoredInstrumentation {
  constructor(adb, logger) {
    this.instrumentationLogsParser = null;
    this.instrumentationStackTrace = '';
    this.instrumentation = new Instrumentation(adb, logger, this._onInstrumentationTerminated.bind(this), this._onInstrumentationLogData.bind(this));
    this.userTerminationFn = _.noop;
    this.pendingPromise = Deferred.resolved();
  }

  async launch(deviceId, bundleId, userLaunchArgs) {
    this.instrumentationLogsParser = new InstrumentationLogsParser();
    await this.instrumentation.launch(deviceId, bundleId, userLaunchArgs);
  }

  setTerminationFn(userTerminationFn) {
    this.userTerminationFn = userTerminationFn || _.noop;
  }

  waitForCrash() {
    if (this.pendingPromise.isPending()) {
      return this.pendingPromise.promise;
    }

    this.pendingPromise = new Deferred();
    if (!this.instrumentation.isRunning()) {
      this._rejectPendingCrashPromise();
    }
    return this.pendingPromise.promise;
  }

  abortWaitForCrash() {
    this.pendingPromise.resolve();
  }

  isRunning() {
    return this.instrumentation.isRunning();
  }

  async terminate() {
    await this.instrumentation.terminate();
    this._rejectPendingCrashPromise();
  }

  async _onInstrumentationTerminated() {
    this._rejectPendingCrashPromise();
    await this.userTerminationFn();
  }

  _rejectPendingCrashPromise() {
    this.pendingPromise.reject(this._getInstrumentationCrashError());
  }

  _onInstrumentationLogData(logsDump) {
    this.instrumentationLogsParser.parse(logsDump);

    if (this.instrumentationLogsParser.containsStackTraceLog(logsDump)) {
      this.instrumentationStackTrace = this.instrumentationLogsParser.getStackTrace(logsDump);
    }
  }

  _getInstrumentationCrashError() {
    return new DetoxRuntimeError({
      message: 'Failed to run application on the device',
      hint: this.instrumentationStackTrace
        ? 'Most likely, your main activity has crashed prematurely.'
        : 'Most likely, your tests have timed out and called detox.cleanup() ' +
        'while it was waiting for "ready" message (over WebSocket) ' +
        'from the instrumentation process.',
      debugInfo: this.instrumentationStackTrace
        ? `Native stacktrace dump: ${this.instrumentationStackTrace}`
        : '',
    });
  }
}

module.exports = MonitoredInstrumentation;
