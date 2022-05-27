const _ = require('lodash');

const Client = require('./client/Client');
const environmentFactory = require('./environmentFactory');
const { DetoxRuntimeErrorComposer } = require('./errors');
const { InvocationManager } = require('./invoke');
const ipcClient = require('./ipc/client');
const NullLogger = require('./logger/NullLogger');
const lifecycleSymbols = require('./symbols').lifecycle;
const AsyncEmitter = require('./utils/AsyncEmitter');
const logger = require('./utils/logger');

const log = logger.child({ __filename });

class DetoxWorkerContext {
  constructor() {
    for (const [key, symbol] of Object.entries(lifecycleSymbols)) {
      this[symbol] = this[symbol]
        ? this[symbol].bind(this)
        : (...args) => this._artifactsManager[key](...args);
    }

    this._logger = new NullLogger();
    this._isTearingDown = false;
    this._runtimeErrorComposer = new DetoxRuntimeErrorComposer({
      appsConfig: {}
    });
    this._client = null;
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
    this._deviceAllocator = null;
    this._deviceCookie = null;
  }

  async setup() {
    if (this._isTearingDown) return;

    const { appsConfig, artifactsConfig, behaviorConfig, deviceConfig, sessionConfig } = await ipcClient.getDetoxConfig();
    if (this._isTearingDown) return;

    this._appsConfig = appsConfig;
    this._artifactsConfig = artifactsConfig;
    this._behaviorConfig = behaviorConfig;
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this._runtimeErrorComposer.appsConfig = this._appsConfig;

    this._client = new Client(sessionConfig);
    this._client.terminateApp = async () => {
      if (this.device && this.device._isAppRunning()) {
        await this.device.terminateApp();
      }
    };

    await this._client.connect();
    if (this._isTearingDown) return;

    const invocationManager = new InvocationManager(this._client);

    const {
      // @ts-ignore
      envValidatorFactory,
      deviceAllocatorFactory,
      // @ts-ignore
      artifactsManagerFactory,
      // @ts-ignore
      matchersFactory,
      // @ts-ignore
      runtimeDeviceFactory,
    } = environmentFactory.createFactories(this._deviceConfig);

    const envValidator = envValidatorFactory.createValidator();
    await envValidator.validate();
    if (this._isTearingDown) return;

    const commonDeps = {
      invocationManager,
      client: this._client,
      eventEmitter: this._eventEmitter,
      runtimeErrorComposer: this._runtimeErrorComposer,
    };

    this._artifactsManager = artifactsManagerFactory.createArtifactsManager(this._artifactsConfig, commonDeps);
    this._deviceAllocator = deviceAllocatorFactory.createDeviceAllocator(commonDeps);
    this._deviceCookie = await this._deviceAllocator.allocate(this._deviceConfig);
    if (this._isTearingDown) return;

    this.device = runtimeDeviceFactory.createRuntimeDevice(
      this._deviceCookie,
      commonDeps,
      {
        appsConfig: this._appsConfig,
        behaviorConfig: this._behaviorConfig,
        deviceConfig: this._deviceConfig,
        sessionConfig,
      });
    await this.device._prepare();
    if (this._isTearingDown) return;

    const matchers = matchersFactory.createMatchers({
      invocationManager,
      runtimeDevice: this.device,
      eventEmitter: this._eventEmitter,
    });
    Object.assign(this, matchers);

    if (behaviorConfig.init.exposeGlobals) {
      Object.assign(DetoxWorkerContext.global, {
        ...matchers,
        device: this.device,
        detox: this,
      });
    }

    await this.device.installUtilBinaries();
    if (this._isTearingDown) return;

    if (behaviorConfig.init.reinstallApp) {
      await this._reinstallAppsOnDevice();
    }

    return this;
  }

  async teardown() {
    this._isTearingDown = true;

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
      const shutdown = this._behaviorConfig ? this._behaviorConfig.cleanup.shutdownDevice : false;
      await this.device._cleanup();
      await this._deviceAllocator.free(this._deviceCookie, { shutdown });
    }

    this._deviceAllocator = null;
    this._deviceCookie = null;
    this.device = null;
  }

  get log() {
    return this._logger;
  }

  async [lifecycleSymbols.onTestStart](testSummary) {
    if (this._isTearingDown) return;
    this._validateTestSummary('beforeEach', testSummary);
    this._logTestRunCheckpoint('DETOX_BEFORE_EACH', testSummary);

    if (this._isTearingDown) return;
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: false,
      testName: testSummary.fullName,
    });

    if (this._isTearingDown) return;
    await this._artifactsManager.onTestStart(testSummary);
  }

  async [lifecycleSymbols.onTestDone](testSummary) {
    if (this._isTearingDown) return;
    this._validateTestSummary('afterEach', testSummary);
    this._logTestRunCheckpoint('DETOX_AFTER_EACH', testSummary);

    if (this._isTearingDown) return;
    await this._artifactsManager.onTestDone(testSummary);

    if (this._isTearingDown) return;
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: testSummary.timedOut,
      testName: testSummary.fullName,
    });
  }

  async _reinstallAppsOnDevice() {
    const appNames = _(this._appsConfig)
      .map((config, key) => [key, `${config.binaryPath}:${config.testBinaryPath}`])
      .uniqBy(1)
      .map(0)
      .value();

    for (const appName of appNames) {
      await this.device.selectApp(appName);
      if (this._isTearingDown) return;
      await this.device.uninstallApp();
      if (this._isTearingDown) return;
      await this.device.installApp();
      if (this._isTearingDown) return;
    }

    if (appNames.length !== 1) {
      await this.device.selectApp(null);
    }
  }

  _logTestRunCheckpoint(event, { status, fullName }) {
    log.trace({ event, status }, `${status} test: ${JSON.stringify(fullName)}`);
  }

  _validateTestSummary(methodName, testSummary) {
    if (!_.isPlainObject(testSummary)) {
      throw this._runtimeErrorComposer.invalidTestSummary(methodName, testSummary);
    }

    switch (testSummary.status) {
      case 'running':
      case 'passed':
      case 'failed':
        break;
      default:
        throw this._runtimeErrorComposer.invalidTestSummaryStatus(methodName, testSummary);
    }
  }

  async _dumpUnhandledErrorsIfAny({ testName, pendingRequests }) {
    if (pendingRequests) {
      this._client.dumpPendingRequests({ testName });
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

DetoxWorkerContext.global = global;

module.exports = DetoxWorkerContext;
