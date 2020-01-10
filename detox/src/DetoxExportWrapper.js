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
    this[_detox] = null;

    this.init = this.init.bind(this);
    this.cleanup = this.cleanup.bind(this);

    this.DetoxConstants = DetoxConstants;

    this._definePassthroughMethod('beforeEach');
    this._definePassthroughMethod('afterEach');
    this._definePassthroughMethod('notify');

    this._definePassthroughMethod('element');
    this._definePassthroughMethod('expect');
    this._definePassthroughMethod('waitFor');

    this._defineProxy('by');
    this._defineProxy('device');
  }

  async init(config, params) {
    this[_detox] = await DetoxExportWrapper._initializeInstance(config, params);
    return this[_detox];
  }

  async cleanup() {
    if (this[_detox]) {
      await this[_detox].cleanup();
      this[_detox] = null;
    }
  }

  _definePassthroughMethod(name) {
    this[name] = (...args) => {
      if (this[_detox]) {
        return this[_detox][name](...args);
      }
    };
  }

  _defineProxy(name) {
    this[name] = funpermaproxy(() => (this[_detox] && this[_detox][name]));
  }

  static async _initializeInstance(detoxConfig, params) {
    let instance = null;

    try {
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
      log.error({ event: 'DETOX_INIT_ERROR' }, '\n', err);

      if (instance) {
        await instance.cleanup();
      }

      throw err;
    }
  }

}

module.exports = DetoxExportWrapper;
