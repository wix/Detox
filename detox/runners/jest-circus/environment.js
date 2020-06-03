const _ = require('lodash');
const NodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const DetoxCoreListener = require('./listeners/DetoxCoreListener');
const DetoxInitErrorListener = require('./listeners/DetoxInitErrorListener');
const assertJestCircus26 = require('./utils/assertJestCircus26');
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
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.hookTimeout = 300000;
  }

  get detox() {
    return require('../../src')._setGlobal(this.global);
  }

  async handleTestEvent(event, state) {
    const { name } = event;

    await this._timely(async () => {
      if (name === 'setup') {
        await this._onSetup(state);
      }

      for (const listener of this.testEventListeners) {
        if (typeof listener[name] === 'function') {
          await listener[name](event, state);
        }
      }

      if (name === 'teardown') {
        await this.cleanupDetox();
      }
    });

    this.hookTimeout = state.testTimeout;
  }

  _timely(fn) {
    return timely(fn, this.hookTimeout, () => {
      return new Error(`Exceeded timeout of ${this.hookTimeout}ms.`);
    })();
  }

  async _onSetup(state) {
    let detox = null;

    try {
      detox = await this.initDetox();
    } catch (initError) {
      state.unhandledErrors.push(initError);

      try {
        await this.cleanupDetox();
      } catch (cleanupError) {
        state.unhandledErrors.push(cleanupError);
      }
    }

    for (const Listener of Object.values(this._listenerFactories)) {
      this.testEventListeners.push(new Listener({
        detox,
        env: this,
      }));
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
