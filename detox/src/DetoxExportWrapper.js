const funpermaproxy = require('funpermaproxy');

const Detox = require('./Detox');
const DetoxConstants = require('./DetoxConstants');
const configuration = require('./configuration');
const logger = require('./utils/logger');
const log = logger.child({ __filename });
const { trace, traceCall } = require('./utils/trace');

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
    this._defineProxy('web');

    this.trace = trace;
    this.traceCall = traceCall;
  }

  async init(configOverride, userParams) {
    let configError, exposeGlobals, resolvedConfig;

    trace.init();
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

DetoxExportWrapper.prototype.hook = configuration.hook;

DetoxExportWrapper.prototype.globalInit = async function() {
  try {
    // TODO This can only work in Jest, where config info etc. is available globally through env vars rather
    //   than argv (e.g. in Mocha) -- which we don't have available here.
    //   We will resolve this, ultimately, in https://github.com/wix/Detox/issues/2894 (DAS project), where
    //   this whole hack would be removed altogether.
    const configs = await configuration.composeDetoxConfig({});
    await Detox.globalInit(configs);
  } catch (error) {
    log.warn({ event: 'GLOBAL_INIT' }, 'An error occurred!');
    throw error;
  }
};

DetoxExportWrapper.prototype.globalCleanup = async function() {
  try {
    const configs = await configuration.composeDetoxConfig({});
    await Detox.globalCleanup(configs);
  } catch (error) {
    log.warn({ event: 'GLOBAL_CLEANUP' }, 'An error occurred!', error);
  }
};

module.exports = DetoxExportWrapper;
