const CAF = require('caf');
const _ = require('lodash');

const Client = require('../client/Client');
const environmentFactory = require('../environmentFactory');
const { DetoxRuntimeErrorComposer } = require('../errors');
const { InvocationManager } = require('../invoke');
const AsyncEmitter = require('../utils/AsyncEmitter');
const log = require('../utils/logger');

class WebDriverSessionContext {
  constructor(capabilities) {
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
    this._appsConfig = capabilities['detox:apps'];
    /** @type {DetoxInternals.RuntimeConfig['behavior']} */
    this._behaviorConfig = capabilities['detox:behavior'];
    /** @type {DetoxInternals.RuntimeConfig['device']} */
    this._deviceConfig = capabilities['detox:device'];
    /** @type {DetoxInternals.RuntimeConfig['session']} */
    this._sessionConfig = capabilities['detox:session'];

    this._runtimeErrorComposer = new DetoxRuntimeErrorComposer({
      appsConfig: this._appsConfig,
    });

    /** @type {Detox.Device} */
    this.device = null;

    this.client = new Client(this._sessionConfig);
    this.client.terminateApp = async () => {
      // @ts-ignore
      if (this.device && this.device._isAppRunning()) {
        await this.device.terminateApp();
      }
    };

    this._deviceAllocator = null;
    this._deviceCookie = null;

    this._initToken = new CAF.cancelToken();
    this._cafWrap(['init', '_reinstallAppsOnDevice']);
  }

  /** @this {WebDriverSessionContext} */
  init = function* (signal) {
    yield this.client.connect();

    const invocationManager = new InvocationManager(this.client);

    const {
      // @ts-ignore
      envValidatorFactory,
      deviceAllocatorFactory,
      // @ts-ignore
      matchersFactory,
      // @ts-ignore
      runtimeDeviceFactory,
    } = environmentFactory.createFactories(this._deviceConfig);

    const envValidator = envValidatorFactory.createValidator();
    yield envValidator.validate();

    const commonDeps = {
      invocationManager,
      client: this.client,
      eventEmitter: this._eventEmitter,
      runtimeErrorComposer: this._runtimeErrorComposer,
    };

    this._deviceAllocator = deviceAllocatorFactory.createDeviceAllocator(commonDeps);
    this._deviceCookie = yield this._deviceAllocator.allocate(this._deviceConfig);

    yield this._deviceAllocator.postAllocate(this._deviceCookie);

    this.device = runtimeDeviceFactory.createRuntimeDevice(
      this._deviceCookie,
      commonDeps,
      {
        appsConfig: this._appsConfig,
        behaviorConfig: this._behaviorConfig,
        deviceConfig: this._deviceConfig,
        sessionConfig: this._sessionConfig,
      });

    const matchers = matchersFactory.createMatchers({
      invocationManager,
      runtimeDevice: this.device,
      eventEmitter: this._eventEmitter,
    });

    Object.assign(this, matchers);

    // @ts-ignore
    yield this.device.installUtilBinaries();
    yield this._reinstallAppsOnDevice(signal);

    const appAliases = Object.keys(this._appsConfig);
    if (appAliases.length === 1) {
      yield this.device.selectApp(appAliases[0]);
    } else {
      yield this.device.selectApp(null);
    }
  };

  async cleanup() {
    this._initToken.abort('CLEANUP');

    if (this.client) {
      this.client.dumpPendingRequests();
      await this.client.cleanup();
      this.client = null;
    }

    if (this.device) {
      // @ts-ignore
      await this.device._cleanup();
    }

    if (this._deviceCookie) {
      const shutdown = this._behaviorConfig ? this._behaviorConfig.cleanup.shutdownDevice : false;
      await this._deviceAllocator.free(this._deviceCookie, { shutdown });
    }

    this._deviceAllocator = null;
    this._deviceCookie = null;
    this.device = null;
  }

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

  _onEmitError({ error, eventName, eventObj }) {
    log.error(
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

module.exports = WebDriverSessionContext;
