const { URL } = require('url');
const util = require('util');

const _ = require('lodash');

const lifecycleSymbols = require('../runners/integration').lifecycle;

const Client = require('./client/Client');
const environmentFactory = require('./environmentFactory');
const DetoxRuntimeErrorComposer = require('./errors/DetoxRuntimeErrorComposer');
const { InvocationManager } = require('./invoke');
const DetoxServer = require('./server/DetoxServer');
const AsyncEmitter = require('./utils/AsyncEmitter');
const Deferred = require('./utils/Deferred');
const MissingDetox = require('./utils/MissingDetox');
const logger = require('./utils/logger');
const log = logger.child({ __filename });

const _initHandle = Symbol('_initHandle');
const _assertNoPendingInit = Symbol('_assertNoPendingInit');

class Detox {
  constructor(config) {
    log.trace(
      { event: 'DETOX_CREATE', config },
      'created a Detox instance with config:\n%s',
      util.inspect(_.omit(config, ['errorComposer']), {
        getters: false,
        depth: Infinity,
        maxArrayLength: Infinity,
        maxStringLength: Infinity,
        breakLength: false,
        compact: false,
      })
    );

    this[_initHandle] = null;

    for (const [key, symbol] of Object.entries(lifecycleSymbols)) {
      this[symbol] = (...args) => this._artifactsManager[key](...args);
    }

    this[lifecycleSymbols.onTestStart] = this.beforeEach;
    this[lifecycleSymbols.onTestDone] = this.afterEach;

    const { appsConfig, artifactsConfig, behaviorConfig, deviceConfig, sessionConfig } = config;

    this._appsConfig = appsConfig;
    this._artifactsConfig = artifactsConfig;
    this._behaviorConfig = behaviorConfig;
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this._runtimeErrorComposer = new DetoxRuntimeErrorComposer({ appsConfig });

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
    this._deviceAllocator = null;
    this._deviceCookie = null;
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
      const shutdown = this._behaviorConfig.cleanup.shutdownDevice;
      await this.device._cleanup();
      await this._deviceAllocator.free(this._deviceCookie, { shutdown });
    }

    if (this._server) {
      await this._server.close();
      this._server = null;
    }

    this._deviceAllocator = null;
    this._deviceCookie = null;
    this.device = null;
  }

  async beforeEach(testSummary) {
    await this[_assertNoPendingInit]();

    this._validateTestSummary('beforeEach', testSummary);
    this._logTestRunCheckpoint('DETOX_BEFORE_EACH', testSummary);
    await this._dumpUnhandledErrorsIfAny({
      pendingRequests: false,
      testName: testSummary.fullName,
    });
    await this._artifactsManager.onTestStart(testSummary);
  }

  async afterEach(testSummary) {
    await this[_assertNoPendingInit]();

    this._validateTestSummary('afterEach', testSummary);
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
        standalone: false,
      });

      await this._server.open();
    }

    this._client = new Client(sessionConfig);
    this._client.terminateApp = async () => {
      if (this.device && this.device._isAppRunning()) {
        await this.device.terminateApp();
      }
    };

    await this._client.connect();

    const invocationManager = new InvocationManager(this._client);

    const {
      envValidatorFactory,
      deviceAllocatorFactory,
      artifactsManagerFactory,
      matchersFactory,
      runtimeDeviceFactory,
    } = environmentFactory.createFactories(this._deviceConfig);

    const envValidator = envValidatorFactory.createValidator();
    await envValidator.validate();

    const commonDeps = {
      invocationManager,
      client: this._client,
      eventEmitter: this._eventEmitter,
      runtimeErrorComposer: this._runtimeErrorComposer,
    };

    this._artifactsManager = artifactsManagerFactory.createArtifactsManager(this._artifactsConfig, commonDeps);

    this._deviceAllocator = deviceAllocatorFactory.createDeviceAllocator(commonDeps);
    this._deviceCookie = await this._deviceAllocator.allocate(this._deviceConfig);

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

    const matchers = matchersFactory.createMatchers({
      invocationManager,
      runtimeDevice: this.device,
      eventEmitter: this._eventEmitter,
    });
    Object.assign(this, matchers);

    if (behaviorConfig.exposeGlobals) {
      Object.assign(Detox.global, {
        ...matchers,
        device: this.device,
      });
    }

    await this.device.installUtilBinaries();
    if (behaviorConfig.reinstallApp) {
      await this._reinstallAppsOnDevice();
    }

    return this;
  }

  [_assertNoPendingInit]() {
    const handle = this[_initHandle];
    if (!handle) {
      return Promise.resolve();
    }

    if (handle.status === Deferred.PENDING) {
      handle.reject(this._runtimeErrorComposer.abortedDetoxInit());
    }

    return handle.promise;
  }

  async _reinstallAppsOnDevice() {
    const appNames = _(this._appsConfig)
      .map((config, key) => [key, `${config.binaryPath}:${config.testBinaryPath}`])
      .uniqBy(1)
      .map(0)
      .value();

    for (const appName of appNames) {
      await this.device.selectApp(appName);
      await this.device.uninstallApp();
      await this.device.installApp();
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

  static async globalInit(configs) {
    const handler = await environmentFactory.createGlobalLifecycleHandler(configs.deviceConfig);
    if (handler) {
      await handler.globalInit();
    }
  }

  static async globalCleanup(configs) {
    const handler = await environmentFactory.createGlobalLifecycleHandler(configs.deviceConfig);
    if (handler) {
      await handler.globalCleanup();
    }
  }
}

Detox.none = new MissingDetox();
Detox.global = global;

module.exports = Detox;
