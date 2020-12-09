const funpermaproxy = require('funpermaproxy');
const Detox = require('./Detox');
const DetoxConstants = require('./DetoxConstants');
const configuration = require('./configuration');
const logger = require('./utils/logger');
const log = logger.child({ __filename });
const { traceCall } = require('./utils/trace');

const _detox = Symbol('detox');
const _shouldLogInitError = Symbol('shouldLogInitError');

class DetoxExportWrapper {
  constructor() {
    this[_detox] = Detox.none;
    this[_shouldLogInitError] = true;

    this.init = this.init.bind(this);
    this.cleanup = this.cleanup.bind(this);

    this.DetoxConstants = DetoxConstants;

    this._definePassthroughMethod('beforeEach');
    this._definePassthroughMethod('afterEach');
    this._definePassthroughMethod('suiteStart');
    this._definePassthroughMethod('suiteEnd');

    this._definePassthroughMethod('element');
    this._definePassthroughMethod('expect');
    this._definePassthroughMethod('waitFor');

    this._defineProxy('by');
    this._defineProxy('device');
  }

  async init(configOverride, userParams) {
    let configError, exposeGlobals, resolvedConfig;

    logger.reinitialize(Detox.global);

    try {
      resolvedConfig = await configuration.composeDetoxConfig({
        override: configOverride,
        userParams,
      });

      exposeGlobals = resolvedConfig.behaviorConfig.init.exposeGlobals;
    } catch (err) {
      configError = err;
      exposeGlobals = true;
    }

    try {
      if (exposeGlobals) {
        Detox.none.initContext(Detox.global);
      }

      if (configError) {
        throw configError;
      }

      this[_detox] = new Detox(resolvedConfig);
      await traceCall('detoxInit', () => this[_detox].init());
      Detox.none.setError(null);

      return this[_detox];
    } catch (err) {
      if (this[_shouldLogInitError]) {
        log.error({ event: 'DETOX_INIT_ERROR' }, '\n', err);
      }

      Detox.none.setError(err);
      throw err;
    }
  }

  async cleanup() {
    Detox.none.cleanupContext(Detox.global);

    if (this[_detox] !== Detox.none) {
      await this[_detox].cleanup();
      this[_detox] = Detox.none;
    }
  }

  _definePassthroughMethod(name) {
    this[name] = (...args) => {
      return this[_detox][name](...args);
    };
  }

  _defineProxy(name) {
    this[name] = funpermaproxy(() => this[_detox][name]);
  }

  /** Use for test runners with sandboxed global */
  _setGlobal(global) {
    Detox.global = global;
    return this;
  }

  /** @internal */
  _suppressLoggingInitErrors() {
    this[_shouldLogInitError] = false;
    return this;
  }
}

DetoxExportWrapper.prototype.globalCleanup = async function() {
  try {
    // TODO For the next consumer, need to come up with some kind of infra-code to allow for dynamic registration of cleanup-callbacks.
    const GenyCloudDriver = require('./devices/drivers/android/genycloud/GenyCloudDriver');
    await GenyCloudDriver.globalCleanup();
  } catch (error) {
    log.warn({ event: 'GLOBAL_CLEANUP' }, 'An error occurred trying to shut down Genymotion-cloud emulator instances!', error);
  }
}

module.exports = DetoxExportWrapper;
