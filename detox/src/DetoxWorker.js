const CAF = require('caf');
const copilot = require('detox-copilot').default;
const _ = require('lodash');

const Client = require('./client/Client');
const DetoxCopilot = require('./copilot/DetoxCopilot');
const environmentFactory = require('./environmentFactory');
const { DetoxRuntimeErrorComposer } = require('./errors');
const { InvocationManager } = require('./invoke');
const symbols = require('./realms/symbols');
const AsyncEmitter = require('./utils/AsyncEmitter');
const uuid = require('./utils/uuid');

class DetoxWorker {
  constructor(context) {
    this._context = context;
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

    /** @type {DetoxInternals.RuntimeConfig['apps']} */
    this._appsConfig = null;
    /** @type {DetoxInternals.RuntimeConfig['artifacts']} */
    this._artifactsConfig = null;
    /** @type {DetoxInternals.RuntimeConfig['behavior']} */
    this._behaviorConfig = null;
    /** @type {DetoxInternals.RuntimeConfig['device']} */
    this._deviceConfig = null;
    /** @type {DetoxInternals.RuntimeConfig['session']} */
    this._sessionConfig = null;

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
    /** @type {Detox.SystemFacade} */
    this.system = null;
    /** @type {Detox.DetoxCopilotFacade} */
    this.copilot = new DetoxCopilot();

    this._deviceCookie = null;

    this.trace = this._context.trace;
    /** @deprecated */
    this.traceCall = this._context.traceCall;

    this._reinstallAppsOnDevice = CAF(this._reinstallAppsOnDevice.bind(this));
    this._initToken = new CAF.cancelToken();

    this._cafWrap([
      'init',
      'onRunDescribeStart',
      'onTestStart',
      'onHookFailure',
      'onTestFnFailure',
      'onTestDone',
      'onRunDescribeFinish',
    ]);
  }

  /** @this {DetoxWorker} */
  init = function* (signal) {
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
    // @ts-ignore
    this._sessionConfig.sessionId = sessionConfig.sessionId || uuid.UUID();
    this._runtimeErrorComposer.appsConfig = this._appsConfig;

    this._client = new Client(sessionConfig);
    this._client.terminateApp = async () => {
      // @ts-ignore
      if (this.device && this.device._isAppRunning()) {
        await this.device.terminateApp();
      }
    };

    yield this._client.connect();

    const invocationManager = new InvocationManager(this._client);

    const {
      // @ts-ignore
      envValidatorFactory,
      // @ts-ignore
      artifactsManagerFactory,
      // @ts-ignore
      matchersFactory,
      // @ts-ignore
      runtimeDeviceFactory,
    } = environmentFactory.createFactories(deviceConfig);

    const envValidator = envValidatorFactory.createValidator();
    yield envValidator.validate();

    const commonDeps = {
      invocationManager,
      client: this._client,
      eventEmitter: this._eventEmitter,
      runtimeErrorComposer: this._runtimeErrorComposer,
    };

    this._artifactsManager = artifactsManagerFactory.createArtifactsManager(this._artifactsConfig, commonDeps);
    this._deviceCookie = yield this._context[symbols.allocateDevice](this._deviceConfig);

    this.device = runtimeDeviceFactory.createRuntimeDevice(
      this._deviceCookie,
      commonDeps,
      {
        appsConfig: this._appsConfig,
        behaviorConfig: this._behaviorConfig,
        deviceConfig: this._deviceConfig,
        sessionConfig,
      });

    const matchers = matchersFactory.createMatchers({
      invocationManager,
      runtimeDevice: this.device,
      eventEmitter: this._eventEmitter,
    });
    Object.assign(this, matchers);

    yield this._eventEmitter.emit('bootDevice', { deviceId: this.device.id });

    if (behaviorConfig.init.exposeGlobals) {
      const injectedGlobals = {
        ...matchers,
        device: this.device,
        copilot: this.copilot,
        detox: this,
      };

      this._injectedGlobalProperties = Object.keys(injectedGlobals);
      Object.assign(DetoxWorker.global, injectedGlobals);
    }

    // @ts-ignore
    yield this.device.installUtilBinaries();

    if (behaviorConfig.init.reinstallApp) {
      yield this._reinstallAppsOnDevice(signal);
    }

    const appAliases = Object.keys(this._appsConfig);
    if (appAliases.length === 1) {
      yield this.device.selectApp(appAliases[0]);
    } else {
      yield this.device.selectApp(null);
    }
  };

  async cleanup() {
    this._initToken.abort('CLEANUP');

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
      // @ts-ignore
      await this.device._cleanup();
    }

    if (this._deviceCookie) {
      await this._context[symbols.deallocateDevice](this._deviceCookie);
    }

    this._deviceCookie = null;
    this.device = null;
  }

  get log() {
    return this._context.log;
  }

  onRunDescribeStart = function* (_signal, ...args) {
    yield this._artifactsManager.onRunDescribeStart(...args);
  };

  onTestStart = function* (_signal, testSummary){
    if (copilot.isInitialized()) {
      copilot.start();
    }

    this._validateTestSummary('beforeEach', testSummary);

    yield this._dumpUnhandledErrorsIfAny({
      pendingRequests: false,
      testName: testSummary.fullName,
    });

    yield this._artifactsManager.onTestStart(testSummary);
  };

  onHookFailure = function* (_signal, ...args) {
    yield this._artifactsManager.onHookFailure(...args);
  };

  onTestFnFailure = function* (_signal, ...args) {
    yield this._artifactsManager.onTestFnFailure(...args);
  };

  onTestDone = function* (_signal, testSummary) {
    this._validateTestSummary('afterEach', testSummary);

    yield this._artifactsManager.onTestDone(testSummary);

    yield this._dumpUnhandledErrorsIfAny({
      pendingRequests: testSummary.timedOut,
      testName: testSummary.fullName,
    });

    if (copilot.isInitialized()) {
      // In case of failure, pass false to copilot, so temporary cache is not saved
      copilot.end(testSummary.status === 'passed');
    }
  };

  onRunDescribeFinish = function* (_signal, ...args) {
    yield this._artifactsManager.onRunDescribeFinish(...args);
  };

  *_reinstallAppsOnDevice(_signal) {
    const appNames = _(this._appsConfig)
      .map((config, key) => [key, `${config.binaryPath}:${config.testBinaryPath}`])
      .uniqBy(1)
      .map(0)
      .value();

    for (const appName of appNames) {
      yield this.device.selectApp(appName);
      yield this.device.uninstallApp();
    }

    for (const appName of appNames) {
      yield this.device.selectApp(appName);
      yield this.device.installApp();
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

  _cafWrap(methodNames) {
    for (const methodName of methodNames) {
      const cafMethod = CAF(this[methodName].bind(this));
      this[methodName] = async (...args) => {
        try {
          await cafMethod(this._initToken.signal, ...args);
        } catch (e) {
          if (e !== 'CLEANUP') {
            throw e;
          }
        }

        return this;
      };
    }
  }

}

/**
 * @type {NodeJS.Global | {}}
 */
DetoxWorker.global = global;

module.exports = DetoxWorker;
