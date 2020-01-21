const _ = require('lodash');
const funpermaproxy = require('funpermaproxy');
const Detox = require('./Detox');
const DetoxConstants = require('./DetoxConstants');
const argparse = require('./utils/argparse');
const log = require('./utils/logger').child({ __filename });
const configuration = require('./configuration');

const _detox = Symbol('detox');

class DetoxExportWrapper {
  constructor() {
    this[_detox] = Detox.none;

    this.init = this.init.bind(this);
    this.cleanup = this.cleanup.bind(this);

    this.DetoxConstants = DetoxConstants;

    this._definePassthroughMethod('beforeEach');
    this._definePassthroughMethod('afterEach');

    this._definePassthroughMethod('element');
    this._definePassthroughMethod('expect');
    this._definePassthroughMethod('waitFor');

    this._defineProxy('by');
    this._defineProxy('device');
  }

  async init(config, params) {
    if (!params || params.initGlobals !== false) {
      Detox.none.initContext(global);
    }

    this[_detox] = await DetoxExportWrapper._initializeInstance(config, params);
    return this[_detox];
  }

  async cleanup() {
    Detox.none.cleanupContext(global);

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

  static async _initializeInstance(detoxConfig, params) {
    let instance = null;

    try {
      Detox.none.setError(null);

      if (!detoxConfig) {
        throw new Error(`No configuration was passed to detox, make sure you pass a detoxConfig when calling 'detox.init(detoxConfig)'`);
      }

      if (!(detoxConfig.configurations && _.size(detoxConfig.configurations) >= 1)) {
        throw new Error(`There are no device configurations in the detox config`);
      }

      const deviceConfig = configuration.composeDeviceConfig(detoxConfig);
      const configurationName = _.findKey(detoxConfig.configurations, (config) => config === deviceConfig);
      const artifactsConfig = configuration.composeArtifactsConfig({
        configurationName,
        detoxConfig,
        deviceConfig,
      });

      instance = new Detox({
        deviceConfig,
        artifactsConfig,
        session: detoxConfig.session,
      });

      await instance.init(params);
      return instance;
    } catch (err) {
      Detox.none.setError(err);
      log.error({ event: 'DETOX_INIT_ERROR' }, '\n', err);

      if (instance) {
        await instance.cleanup();
      }

      throw err;
    }
  }

}

module.exports = DetoxExportWrapper;
