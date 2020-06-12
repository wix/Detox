const _ = require('lodash');
const NodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const DetoxCoreListener = require('./listeners/DetoxCoreListener');
const DetoxInitErrorListener = require('./listeners/DetoxInitErrorListener');
const assertJestCircus26 = require('./utils/assertJestCircus26');
const wrapErrorWithNoopLifecycle = require('./utils/wrapErrorWithNoopLifecycle');
const timely = require('../../src/utils/timely');

/**
 * @see https://www.npmjs.com/package/jest-circus#overview
 */
class DetoxCircusEnvironment extends NodeEnvironment {
  constructor(config) {
    super(assertJestCircus26(config));

    /** @private */
    this._listenerFactories = {
      DetoxInitErrorListener,
      DetoxCoreListener,
    };
    /** @private */
    this._hookTimeout = undefined;
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.initTimeout = 300000;
  }

  get detox() {
    return require('../../src')._setGlobal(this.global);
  }

  async handleTestEvent(event, state) {
    const { name } = event;

    if (name === 'setup') {
      await this._onSetup(state);
    }

    await this._timely(async () => {
      for (const listener of this.testEventListeners) {
        if (typeof listener[name] === 'function') {
          await listener[name](event, state);
        }
      }
    });

    if (name === 'teardown') {
      await this._onTeardown();
    }
  }

  _timely(fn) {
    const ms = this._hookTimeout === undefined ? this.initTimeout : this._hookTimeout;
    return timely(fn, ms, () => {
      return new Error(`Exceeded timeout of ${ms}ms.`);
    })();
  }

  async _onSetup(state) {
    let detox = null;

    try {
      try {
        detox = await this._timely(() => this.initDetox());
      } finally {
        this._hookTimeout = state.testTimeout;
      }
    } catch (initError) {
      state.unhandledErrors.push(initError);
      detox = wrapErrorWithNoopLifecycle(initError);
      await this._onTeardown();
    }

    this._instantiateListeners(detox);
  }

  _instantiateListeners(detoxInstance) {
    for (const Listener of Object.values(this._listenerFactories)) {
      this.testEventListeners.push(new Listener({
        detox: detoxInstance,
        env: this,
      }));
    }
  }

  async _onTeardown() {
    try {
      await this._timely(() => this.cleanupDetox());
    } catch (cleanupError) {
      state.unhandledErrors.push(cleanupError);
    }
  }

  /** @protected */
  async initDetox() {
    return this.detox.init();
  }

  /** @protected */
  async cleanupDetox() {
    return this.detox.cleanup();
  }

  /** @protected */
  registerListeners(map) {
    Object.assign(this._listenerFactories, map);
  }
}

module.exports = DetoxCircusEnvironment;
