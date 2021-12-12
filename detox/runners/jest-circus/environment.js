const NodeEnvironment = require('jest-environment-node');

const DetoxError = require('../../src/errors/DetoxError');
const Timer = require('../../src/utils/Timer');

const DetoxCoreListener = require('./listeners/DetoxCoreListener');
const DetoxInitErrorListener = require('./listeners/DetoxInitErrorListener');
const assertExistingContext = require('./utils/assertExistingContext');
const assertJestCircus26 = require('./utils/assertJestCircus26');
const wrapErrorWithNoopLifecycle = require('./utils/wrapErrorWithNoopLifecycle');

const SYNC_CIRCUS_EVENTS = new Set([
  'start_describe_definition',
  'finish_describe_definition',
  'add_hook',
  'add_test',
  'error',
]);

/**
 * @see https://www.npmjs.com/package/jest-circus#overview
 */
class DetoxCircusEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(assertJestCircus26(config), assertExistingContext(context));

    /** @private */
    this._timer = null;
    /** @private */
    this._listenerFactories = {
      DetoxInitErrorListener,
      DetoxCoreListener,
    };
    /** @private */
    this._calledDetoxInit = false;
    /** @private */
    this._calledDetoxCleanup = false;
    /** @protected */
    this.testPath = context.testPath;
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.initTimeout = 300000;
  }

  async setup() {
    await super.setup();

    this.global.detox = require('../../src')
      ._setGlobal(this.global)
      ._suppressLoggingInitErrors();
  }

  async teardown() {
    try {
      if (this._calledDetoxInit && !this._calledDetoxCleanup) {
        await this._runEmergencyTeardown();
      }
    } finally {
      await super.teardown();
    }
  }

  get detox() {
    return this.global.detox;
  }

  async handleTestEvent(event, state) {
    const { name } = event;

    if (SYNC_CIRCUS_EVENTS.has(name)) {
      return this._handleTestEventSync(event, state);
    }

    this._timer = new Timer({
      description: `handling jest-circus "${name}" event`,
      timeout: name === 'setup' ? this.initTimeout : state.testTimeout,
    });

    try {
      if (name === 'setup') {
        await this._onSetup(state);
      }

      for (const listener of this.testEventListeners) {
        if (typeof listener[name] === 'function') {
          try {
            await this._timer.run(() => listener[name](event, state));
          } catch (listenerError) {
            this._logError(listenerError);
          }
        }
      }

      if (name === 'teardown') {
        await this._onTeardown(state);
      }
    } finally {
      this._timer.dispose();
      this._timer = null;
    }
  }

  _handleTestEventSync(event, state) {
    const { name } = event;

    for (const listener of this.testEventListeners) {
      if (typeof listener[name] === 'function') {
        listener[name](event, state);
      }
    }
  }

  async _onSetup(state) {
    let detox;

    try {
      detox = await this._timer.run(async () => {
        try {
          this._calledDetoxInit = true;
          return await this.initDetox();
        } catch (actualError) {
          state.unhandledErrors.push(actualError);
          this._logError(actualError);
          throw actualError;
        }
      });
    } catch (maybeActualError) {
      if (!state.unhandledErrors.includes(maybeActualError)) {
        const timeoutError = maybeActualError;
        state.unhandledErrors.push(timeoutError);
        this._logError(timeoutError);
      }

      detox = wrapErrorWithNoopLifecycle(maybeActualError);
    } finally {
      this._timer.reset(state.testTimeout);
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

  async _onTeardown(state) {
    try {
      this._calledDetoxCleanup = true;
      await this._timer.run(() => this.cleanupDetox());
    } catch (cleanupError) {
      state.unhandledErrors.push(cleanupError);
      this._logError(cleanupError);
    }
  }

  async _runEmergencyTeardown() {
    this._timer = new Timer({
      description: `handling environment teardown`,
      timeout: this.initTimeout,
    });

    try {
      await this._timer.run(() => this.cleanupDetox());
    } catch (cleanupError) {
      this._logError(cleanupError);
    } finally {
      this._timer.dispose();
      this._timer = null;
    }
  }

  /** @private */
  get _logger() {
    return require('../../src/utils/logger');
  }

  /** @private */
  _logError(e) {
    this._logger.error(DetoxError.format(e));
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
