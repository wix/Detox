const _ = require('lodash');
const funpermaproxy = require('funpermaproxy');
const Detox = require('./Detox');
const DetoxConstants = require('./DetoxConstants');
const configuration = require('./configuration');
const log = require('./utils/logger').child({ __filename });

const _detox = Symbol('detox');

class DetoxExportWrapper {
  constructor() {
    this[_detox] = Detox.none;

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
        Detox.none.initContext(global);
      }

      if (configError) {
        throw configError;
      }

      this[_detox] = new Detox(resolvedConfig);
      await this[_detox].init();
      Detox.none.setError(null);

      return this[_detox];
    } catch (err) {
      Detox.none.setError(err);

      log.error({ event: 'DETOX_INIT_ERROR' }, '\n', err);
      throw err;
    }
  }

  async cleanup() {
    try {
      if (this[_detox] !== Detox.none) {
        await this[_detox].cleanup();
      }
    } finally {
      this[_detox] = Detox.none;
      Detox.none.cleanupContext(global);
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
}

module.exports = DetoxExportWrapper;
