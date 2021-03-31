const _ = require('lodash');
const util = require('util');
const { deserializeError } = require('serialize-error');
const AsyncWebSocket = require('./AsyncWebSocket');
const actions = require('./actions/actions');
const Deferred = require('../utils/Deferred');
const DetoxInvariantError = require('../errors/DetoxInvariantError');
const log = require('../utils/logger').child({ __filename });
const { asError, createErrorWithUserStack, replaceErrorStack } = require('../utils/errorUtils');

class Client {
  /**
   * @param {number} debugSynchronization
   * @param {string} server
   * @param {string} sessionId
   */
  constructor({ debugSynchronization, server, sessionId  }) {
    this._onAppConnected = this._onAppConnected.bind(this);
    this._onAppReady = this._onAppReady.bind(this);
    this._onAppUnresponsive = this._onAppUnresponsive.bind(this);
    this._onBeforeAppCrash = this._onBeforeAppCrash.bind(this);
    this._onAppDisconnected = this._onAppDisconnected.bind(this);
    this._onUnhandledServerError = this._onUnhandledServerError.bind(this);

    this._sessionId = sessionId;
    this._slowInvocationTimeout = debugSynchronization;
    this._slowInvocationStatusHandle = null;
    this._whenAppIsConnected = new Deferred();
    this._whenAppIsReady = new Deferred();
    this._isCleaningUp = false;

    this._successfulTestRun = true; // flag for cleanup
    this._pendingAppCrash = undefined;
    this._asyncWebSocket = new AsyncWebSocket(server);
    this._serverUrl = server;

    this.setEventCallback('appConnected', this._onAppConnected);
    this.setEventCallback('ready', this._onAppReady);
    this.setEventCallback('AppNonresponsiveDetected', this._onAppUnresponsive);
    this.setEventCallback('AppWillTerminateWithError', this._onBeforeAppCrash);
    this.setEventCallback('appDisconnected', this._onAppDisconnected);
    this.setEventCallback('serverError', this._onUnhandledServerError);
  }

  /**
   * Tells whether the DetoxManager (from native side) is connected to Detox server.
   * In other words, if we can communicate with the app and send actions to it.
   *
   * @returns {boolean}
   */
  get isConnected() {
    return this._asyncWebSocket.isOpen && this._whenAppIsConnected.isResolved();
  }

  get serverUrl() {
    return this._serverUrl;
  }

  async connect() {
    await this._asyncWebSocket.open();
    const sessionStatus = await this.sendAction(new actions.Login(this._sessionId));
    if (sessionStatus.appConnected) {
      this._whenAppIsConnected.resolve();
    }
  }

  async cleanup() {
    this._isCleaningUp = true;
    this._unscheduleSlowInvocationQuery();

    try {
      if (this.isConnected && !this._pendingAppCrash) {
        await this.sendAction(new actions.Cleanup(this._successfulTestRun));

        this._whenAppIsConnected = new Deferred();
        this._whenAppIsReady = new Deferred();
      }
    } finally {
      await this._asyncWebSocket.close();
    }
  }

  setEventCallback(event, callback) {
    this._asyncWebSocket.setEventCallback(event, callback);
  }

  getPendingCrashAndReset() {
    const crash = this._pendingAppCrash;
    this._pendingAppCrash = undefined;

    return crash;
  }

  dumpPendingRequests({testName} = {}) {
    const messages = _.values(this._asyncWebSocket.inFlightPromises)
      .map(p => p.message)
      .filter(m => m && m.type !== 'currentStatus');

    if (_.isEmpty(messages)) {
      return;
    }

    let dump = 'App has not responded to the network requests below:';
    for (const msg of messages) {
      dump += `\n  (id = ${msg.messageId}) ${msg.type}: ${JSON.stringify(msg.params)}`;
    }

    const notice = testName
      ? `That might be the reason why the test "${testName}" has timed out.`
      : `Unresponded network requests might result in timeout errors in Detox tests.`;

    dump += `\n\n${notice}\n`;

    log.warn({ event: 'PENDING_REQUESTS'}, dump);
    this._asyncWebSocket.resetInFlightPromises();
  }

  async execute(invocation) {
    if (typeof invocation === 'function') {
      invocation = invocation();
    }

    try {
      return await this.sendAction(new actions.Invoke(invocation));
    } catch (err) {
      this._successfulTestRun = false;
      throw err;
    }
  }

  async sendAction(action) {
    const options = this._inferSendOptions(action);

    return await ((options.queryStatus)
      ? this._sendMonitoredAction(action)
      : this._doSendAction(action))
  }

  _inferSendOptions(action) {
    if (action instanceof actions.CurrentStatus) {
      return { queryStatus: false };
    }

    if (action instanceof actions.Login) {
      return { queryStatus: false };
    }

    return { queryStatus: true };
  }

  async _sendMonitoredAction(action) {
    try {
      this._slowInvocationStatusHandle = this._scheduleSlowInvocationQuery();
      return await this._doSendAction(action);
    } finally {
      this._unscheduleSlowInvocationQuery();
    }
  }

  async _doSendAction(action) {
    const errorWithUserStack = createErrorWithUserStack();

    try {
      const parsedResponse = await this._asyncWebSocket.send(action);
      if (parsedResponse && parsedResponse.type === 'serverError') {
        throw deserializeError(parsedResponse.params.error);
      }

      return await action.handle(parsedResponse);
    } catch (err) {
      throw replaceErrorStack(errorWithUserStack, asError(err));
    }
  }

  async reloadReactNative() {
    this._whenAppIsReady = new Deferred();
    await this.sendAction(new actions.ReloadReactNative());
    this._whenAppIsReady.resolve();
  }

  async waitUntilReady() {
    await this._whenAppIsConnected.promise;

    // TODO: optimize traffic (!) - we can just listen for 'ready' event
    // if app always sends it upon load completion. Then this will suffice:
    // await this._whenAppIsReady.promise;

    if (!this._whenAppIsReady.isResolved()) {
      await this.sendAction(new actions.Ready());
      this._whenAppIsReady.resolve();
    }
  }

  async waitForBackground() {
    await this.sendAction(new actions.WaitForBackground());
  }

  async waitForActive() {
    await this.sendAction(new actions.WaitForActive());
  }

  async captureViewHierarchy({ viewHierarchyURL }) {
    return await this.sendAction(new actions.CaptureViewHierarchy({
      viewHierarchyURL
    }));
  }

  async currentStatus() {
    return await this.sendAction(new actions.CurrentStatus());
  }

  async setSyncSettings(params) {
    await this.sendAction(new actions.SetSyncSettings(params));
  }

  async shake() {
    await this.sendAction(new actions.Shake());
  }

  async setOrientation(orientation) {
    await this.sendAction(new actions.SetOrientation(orientation));
  }

  async startInstrumentsRecording({ recordingPath, samplingInterval }) {
    await this.sendAction(new actions.SetInstrumentsRecordingState({
      recordingPath, samplingInterval
    }));
  }

  async stopInstrumentsRecording() {
    await this.sendAction(new actions.SetInstrumentsRecordingState());
  }

  async deliverPayload(params) {
    await this.sendAction(new actions.DeliverPayload(params));
  }

  _scheduleSlowInvocationQuery() {
    if (this._slowInvocationTimeout > 0 && !this._isCleaningUp) {
      return setTimeout(async () => {
        if (this.isConnected) {
          const status = await this.currentStatus();
          log.info({ event: 'CurrentStatus' }, status);
          this._slowInvocationStatusHandle = this._scheduleSlowInvocationQuery();
        }
      }, this._slowInvocationTimeout);
    }

    return null;
  }

  _unscheduleSlowInvocationQuery() {
    clearTimeout(this._slowInvocationStatusHandle);
    this._slowInvocationStatusHandle = null;
  }

  _onAppConnected() {
    this._whenAppIsConnected.resolve();
  }

  _onAppReady() {
    this._whenAppIsReady.resolve();
  }

  _onAppUnresponsive({ params }) {
    const message = [
      'Application nonresponsiveness detected!',
      'On Android, this could imply an ANR alert, which evidently causes tests to fail.',
      'Here\'s the native main-thread stacktrace from the device, to help you out (refer to device logs for the complete thread dump):',
      params.threadDump,
      'Refer to https://developer.android.com/training/articles/perf-anr for further details.'
    ].join('\n');

    log.warn({ event: 'APP_NONRESPONSIVE' }, message);
  }

  _onBeforeAppCrash({ params }) {
    this._pendingAppCrash = params.errorDetails;
    this._asyncWebSocket.rejectAll(this._pendingAppCrash);
    this._whenAppIsConnected = new Deferred();
    this._whenAppIsReady = new Deferred();
  }

  _onAppDisconnected() {
    this._whenAppIsConnected = new Deferred();
    this._whenAppIsReady = new Deferred();
    this._asyncWebSocket.rejectAll(new Error('The app has unexpectedly disconnected from Detox server'));
  }

  _onUnhandledServerError(message) {
    const { params } = message;
    if (!params || !params.error) {
      const err = new DetoxInvariantError('Received an empty error message from Detox Server:\n' + util.inspect(message));
      log.error({ event: 'ERROR' }, err.toString());
    } else {
      log.error({ event: 'ERROR' }, deserializeError(params.error).message);
    }
  }
}

module.exports = Client;
