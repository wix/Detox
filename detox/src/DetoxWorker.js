const _ = require('lodash');

const Client = require('./client/Client');
const environmentFactory = require('./environmentFactory');
const { DetoxRuntimeErrorComposer } = require('./errors');
const { InvocationManager } = require('./invoke');
const symbols = require('./symbols');
const AsyncEmitter = require('./utils/AsyncEmitter');
const uuid = require('./utils/uuid');

class DetoxWorker {
  constructor(context) {
    this._context = context;
    this._isCleaningUp = false;
    this._injectedGlobalProperties = [];
    this._config = context[symbols.config];
    this._runtimeErrorComposer = new DetoxRuntimeErrorComposer(this._config);
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

    /** @type {string} */
    this.id = 'worker';
    /** @type {Detox.Device} */
    this.device = null;
    /** @type {Detox.ElementFacade} */
    this.element = null;
    /** @type {Detox.WaitForFacade} */
    this.waitFor = null;
    /** @type {Detox.ExpectFacade} */
    this.expect = null;
    /** @type {Detox.ByFacade} */
    this.by = null;
    /** @type {Detox.WebFacade} */
    this.web = null;

    this._deviceAllocator = null;
    this._deviceCookie = null;

    this.trace = this._context.trace;
    /** @deprecated */
    this.traceCall = this._context.traceCall;
  }

  async init() {
    if (this._isCleaningUp) return;

    const {
      apps: appsConfig,
      artifacts: artifactsConfig,
      behavior: behaviorConfig,
      device: deviceConfig,
      session: sessionConfig
    } = this._config;

    this._appsConfig = appsConfig;
    this._artifactsConfig = artifactsConfig;
    this._behaviorConfig = behaviorConfig;
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this._sessionConfig.sessionId = sessionConfig.sessionId || uuid.UUID();
    this._runtimeErrorComposer.appsConfig = this._appsConfig;

    this._client = new Client(sessionConfig);
    this._client.terminateApp = async () => {
      // @ts-ignore
      if (this.device && this.device._isAppRunning()) {
        await this.device.terminateApp();
      }
    };

    await this._client.connect();
    if (this._isCleaningUp) return;

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
    if (this._isCleaningUp) return;

    const commonDeps = {
      invocationManager,
      client: this._client,
      eventEmitter: this._eventEmitter,
      runtimeErrorComposer: this._runtimeErrorComposer,
    };

    this._artifactsManager = artifactsManagerFactory.createArtifactsManager(this._artifactsConfig, commonDeps);
    this._deviceAllocator = deviceAllocatorFactory.createDeviceAllocator(commonDeps);
    this._deviceCookie = await this._deviceAllocator.allocate(this._deviceConfig);
    if (this._isCleaningUp) return;

    this.device = runtimeDeviceFactory.createRuntimeDevice(
      this._deviceCookie,
      commonDeps,
      {
        appsConfig: this._appsConfig,
        behaviorConfig: this._behaviorConfig,
        deviceConfig: this._deviceConfig,
        sessionConfig,
      });
    if (this._isCleaningUp) return;

    const matchers = matchersFactory.createMatchers({
      invocationManager,
      runtimeDevice: this.device,
      eventEmitter: this._eventEmitter,
    });
    Object.assign(this, matchers);

    if (behaviorConfig.init.exposeGlobals) {
      const injectedGlobals = {
        ...matchers,
        device: this.device,
        detox: this,
      };

      this._injectedGlobalProperties = Object.keys(injectedGlobals);
      Object.assign(DetoxWorker.global, injectedGlobals);
    }

    // @ts-ignore
    await this.device.installUtilBinaries();
    if (this._isCleaningUp) return;

    if (behaviorConfig.init.reinstallApp) {
      await this._reinstallAppsOnDevice();
      if (this._isCleaningUp) return;
    }

    const appAliases = Object.keys(this._appsConfig);
    if (appAliases.length === 1) {
      await this.device.selectApp(appAliases[0]);
    } else {
      await this.device.selectApp(null);
    }

    return this;
  }

  async cleanup() {
    this._isCleaningUp = true;

    for (const key of this._injectedGlobalProperties) {
      delete DetoxWorker.global[key];
    }

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
      // @ts-ignore
      await this.device._cleanup();
      await this._deviceAllocator.free(this._deviceCookie, { shutdown });
    }

    this._deviceAllocator = null;
    this._deviceCookie = null;
    this.device = null;
  }

  get log() {
    return this._context.log;
  }

  onRunDescribeStart = async (...args) => this._artifactsManager.onRunDescribeStart(...args);
  onTestStart = async (testSummary) => {
    if (this._isCleaningUp) return;
    this._validateTestSummary('beforeEach', testSummary);

    if (this._isCleaningUp) return;
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: false,
      testName: testSummary.fullName,
    });

    if (this._isCleaningUp) return;
    await this._artifactsManager.onTestStart(testSummary);
  };
  onHookFailure = async (...args) => this._artifactsManager.onHookFailure(...args);
  onTestFnFailure = async (...args) => this._artifactsManager.onTestFnFailure(...args);
  onTestDone = async (testSummary) => {
    if (this._isCleaningUp) return;
    this._validateTestSummary('afterEach', testSummary);

    if (this._isCleaningUp) return;
    await this._artifactsManager.onTestDone(testSummary);

    if (this._isCleaningUp) return;
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: testSummary.timedOut,
      testName: testSummary.fullName,
    });
  };
  onRunDescribeFinish = async (...args) => this._artifactsManager.onRunDescribeFinish(...args);

  async _reinstallAppsOnDevice() {
    const appNames = _(this._appsConfig)
      .map((config, key) => [key, `${config.binaryPath}:${config.testBinaryPath}`])
      .uniqBy(1)
      .map(0)
      .value();

    for (const appName of appNames) {
      await this.device.selectApp(appName);
      if (this._isCleaningUp) return;
      await this.device.uninstallApp();
      if (this._isCleaningUp) return;
    }

    for (const appName of appNames) {
      await this.device.selectApp(appName);
      if (this._isCleaningUp) return;
      await this.device.installApp();
      if (this._isCleaningUp) return;
    }
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
    this.log.error(
      { event: 'EMIT_ERROR', fn: eventName },
      `Caught an exception in: emitter.emit("${eventName}", ${JSON.stringify(eventObj)})\n\n`,
      error
    );
  }
}

/**
 * @type {NodeJS.Global | {}}
 */
DetoxWorker.global = global;

module.exports = DetoxWorker;
