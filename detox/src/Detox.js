const _ = require('lodash');
const util = require('util');
const {URL} = require('url');
const logger = require('./utils/logger');
const Deferred = require('./utils/Deferred');
const Device = require('./devices/Device');
const DetoxRuntimeError = require('./errors/DetoxRuntimeError');
const AsyncEmitter = require('./utils/AsyncEmitter');
const MissingDetox = require('./utils/MissingDetox');
const Client = require('./client/Client');
const { InvocationManager } = require('./invoke');
const DetoxServer = require('./server/DetoxServer');
const ArtifactsManager = require('./artifacts/ArtifactsManager');
const log = logger.child({ __filename });
const driverRegistry = require('./devices/DriverRegistry').default;
const matchersRegistry = require('./matchersRegistry');

const _initHandle = Symbol('_initHandle');
const _assertNoPendingInit = Symbol('_assertNoPendingInit');

const lifecycleSymbols = require('../runners/integration').lifecycle;

class Detox {
  constructor(config) {
    log.trace(
      { event: 'DETOX_CREATE', config },
      'created a Detox instance with config:\n%j',
      config
    );

    this[_initHandle] = null;

    for (const [key, symbol] of Object.entries(lifecycleSymbols)) {
      this[symbol] = (...args) => this._artifactsManager[key](...args);
    }

    this[lifecycleSymbols.onTestStart] = this.beforeEach;
    this[lifecycleSymbols.onTestDone] = this.afterEach;

    const {artifactsConfig, behaviorConfig, deviceConfig, sessionConfig} = config;

    this._artifactsConfig = artifactsConfig;
    this._behaviorConfig = behaviorConfig;
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;

    this._client = null;
    this._server = null;
    this._artifactsManager = null;
    this._eventEmitter = new AsyncEmitter({
      events: [
        'bootDevice',
        'beforeShutdownDevice',
        'shutdownDevice',
        'beforeTerminateApp',
        'terminateApp',
        'beforeUninstallApp',
        'beforeLaunchApp',
        'launchApp',
        'appReady',
        'createExternalArtifact',
      ],
      onError: this._onEmitError.bind(this),
    });

    this.device = null;
  }

  init() {
    if (!this[_initHandle]) {
      this[_initHandle] = new Deferred();

      const { resolve, reject } = this[_initHandle];
      this._doInit().then(resolve, reject);
    }

    return this[_initHandle].promise;
  }

  async cleanup() {
    await this[_assertNoPendingInit]().catch(_.noop);

    if (this._artifactsManager) {
      await this._artifactsManager.onBeforeCleanup();
      this._artifactsManager = null;
    }

    if (this._client) {
      this._client.dumpPendingRequests();
      await this._client.cleanup();
      this._client = null;
    }

    if (this.device) {
      await this.device._cleanup();

      if (this._behaviorConfig.cleanup.shutdownDevice) {
        await this.device.shutdown();
      }
    }

    if (this._server) {
      await this._server.close();
      this._server = null;
    }

    this.device = null;
  }

  async beforeEach(testSummary) {
    await this[_assertNoPendingInit]();

    this._validateTestSummary(testSummary);
    this._logTestRunCheckpoint('DETOX_BEFORE_EACH', testSummary);
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: false,
      testName: testSummary.fullName,
    });
    await this._artifactsManager.onTestStart(testSummary);
  }

  async afterEach(testSummary) {
    await this[_assertNoPendingInit]();

    this._validateTestSummary(testSummary);
    this._logTestRunCheckpoint('DETOX_AFTER_EACH', testSummary);
    await this._artifactsManager.onTestDone(testSummary);
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: testSummary.timedOut,
      testName: testSummary.fullName,
    });
  }

  async _doInit() {
    const behaviorConfig = this._behaviorConfig.init;
    const sessionConfig = this._sessionConfig;

    if (this._sessionConfig.autoStart) {
      this._server = new DetoxServer({
        port: new URL(sessionConfig.server).port,
      });
    }

    this._client = new Client(sessionConfig);
    this._client.setNonresponsivenessListener(this._onNonresnponsivenessEvent.bind(this));
    await this._client.connect();

    const invocationManager = new InvocationManager(this._client);
    const deviceDriver = driverRegistry.resolve(this._deviceConfig.type, {
      client: this._client,
      invocationManager,
      emitter: this._eventEmitter,
    });

    this.device = new Device({
      deviceConfig: this._deviceConfig,
      emitter: this._eventEmitter,
      deviceDriver,
      sessionConfig,
    });

    this._artifactsManager = new ArtifactsManager(this._artifactsConfig);
    this._artifactsManager.subscribeToDeviceEvents(this._eventEmitter);
    this._artifactsManager.registerArtifactPlugins(deviceDriver.declareArtifactPlugins());

    await this.device.prepare();

    const matchers = matchersRegistry.resolve(this.device, {
      invocationManager,
      emitter: this._eventEmitter,
    });
    Object.assign(this, matchers);

    if (behaviorConfig.exposeGlobals) {
      Object.assign(Detox.global, {
        ...matchers,
        device: this.device,
      });
    }

    if (behaviorConfig.reinstallApp) {
      await this.device.uninstallApp();
      await this.device.installApp();
    }
    await this.device.installUtilBinaries();

    if (behaviorConfig.launchApp) {
      await this.device.launchApp({
        newInstance: true
      });
    }

    return this;
  }

  [_assertNoPendingInit]() {
    const handle = this[_initHandle];
    if (!handle) {
      return Promise.resolve();
    }

    if (handle.status === Deferred.PENDING) {
      handle.reject(
        new DetoxRuntimeError({
          message: 'Aborted detox.init() execution, and now running detox.cleanup()',
          hint: 'Most likely, your test runner is tearing down the suite due to the timeout error'
        })
      );
    }

    return handle.promise;
  }

  _logTestRunCheckpoint(event, { status, fullName }) {
    log.trace({ event, status }, `${status} test: ${JSON.stringify(fullName)}`);
  }

  _validateTestSummary(testSummary) {
    if (!_.isPlainObject(testSummary)) {
      throw new DetoxRuntimeError({
        message: `Invalid test summary was passed to detox.beforeEach(testSummary)` +
          '\nExpected to get an object of type: { title: string; fullName: string; status: "running" | "passed" | "failed"; }',
        hint: 'Maybe you are still using an old undocumented signature detox.beforeEach(string, string, string) in init.js ?' +
          '\nSee the article for the guidance: ' +
          'https://github.com/wix/detox/blob/master/docs/APIRef.TestLifecycle.md',
        debugInfo: `testSummary was: ${util.inspect(testSummary)}`,
      });
    }

    switch (testSummary.status) {
      case 'running':
      case 'passed':
      case 'failed':
        break;
      default:
        throw new DetoxRuntimeError({
          message: `Invalid test summary status was passed to detox.beforeEach(testSummary). Valid values are: "running", "passed", "failed"`,
          hint: "It seems like you've hit a Detox integration issue with a test runner. You are encouraged to report it in Detox issues on GitHub.",
          debugInfo: `testSummary was: ${JSON.stringify(testSummary, null, 2)}`,
        });
    }
  }

  _onNonresnponsivenessEvent(params) {
    const message = [
      'Application nonresponsiveness detected!',
      'On Android, this could imply an ANR alert, which evidently causes tests to fail.',
      'Here\'s the native main-thread stacktrace from the device, to help you out (refer to device logs for the complete thread dump):',
      params.threadDump,
      'Refer to https://developer.android.com/training/articles/perf-anr for further details.'
    ].join('\n');

    log.warn({ event: 'APP_NONRESPONSIVE' }, message);
  }

  async _dumpUnhandledErrorsIfAny({ testName, pendingRequests }) {
    if (pendingRequests) {
      this._client.dumpPendingRequests({testName});
    }

    const pendingAppCrash = this._client.getPendingCrashAndReset();

    if (pendingAppCrash) {
      log.error({ event: 'APP_CRASH' }, `App crashed in test '${testName}', here are the crash details: \n${pendingAppCrash}`);
      await this.device.launchApp({ newInstance: true });
    }
  }

  _onEmitError({ error, eventName, eventObj }) {
    log.error(
      { event: 'EMIT_ERROR', fn: eventName },
      `Caught an exception in: emitter.emit("${eventName}", ${JSON.stringify(eventObj)})\n\n`,
      error
    );
  }
}

Detox.none = new MissingDetox();
Detox.global = global;

module.exports = Detox;
