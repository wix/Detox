// @ts-nocheck
const maybeNodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const NodeEnvironment = maybeNodeEnvironment.default || maybeNodeEnvironment;

const DetoxSecondaryContext = require('../../../src/DetoxSecondaryContext');
const DetoxError = require('../../../src/errors/DetoxError');
const Timer = require('../../../src/utils/Timer');

const DetoxCoreListener = require('./listeners/DetoxCoreListener');
const DetoxInitErrorListener = require('./listeners/DetoxInitErrorListener');
const DetoxPlatformFilterListener = require('./listeners/DetoxPlatformFilterListener');
const assertExistingContext = require('./utils/assertExistingContext');
const { assertJestCircus27 } = require('./utils/assertJestCircus27');

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
    super(assertJestCircus27(config), assertExistingContext(context));

    /** @private */
    this._timer = null;
    /** @private */
    this._listenerFactories = {
      DetoxInitErrorListener,
      DetoxPlatformFilterListener,
      DetoxCoreListener,
    };
    /** @protected */
    this.testPath = context.testPath;
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.initTimeout = 300000;
    /** @protected */
    this.detox = null;
    /** @protected */
    this.detoxContext = null;
  }

  /** @override */
  async setup() {
    await super.setup();

    await Timer.run({
      description: `setting up Detox environment`,
      timeout: this.initTimeout,
      fn: async () => {
        this.detoxContext = new DetoxSecondaryContext();
        this.detox = await this.detoxContext.init({
          global: this.global,
          workerId: +process.env.JEST_WORKER_ID,
        });

        this._instantiateListeners(this.detox);
      },
    });
  }

  /** @override */
  async handleTestEvent(event, state) {
    const { name } = event;

    if (SYNC_CIRCUS_EVENTS.has(name)) {
      return this._handleTestEventSync(event, state);
    }

    this._timer = new Timer({
      description: `handling jest-circus "${name}" event`,
      timeout: state.testTimeout != null ? state.testTimeout : this.initTimeout,
    });

    try {
      for (const listener of this.testEventListeners) {
        if (typeof listener[name] !== 'function') {
          continue;
        }

        try {
          await this._timer.run(() => listener[name](event, state));
        } catch (listenerError) {
          this._logError(listenerError);
          break;
        }
      }
    } finally {
      this._timer.dispose();
      this._timer = null;
    }
  }

  /** @override */
  async teardown() {
    await Timer.run({
      description: `tearing down Detox environment`,
      timeout: this.initTimeout,
      fn: async () => {
        await this.detoxContext.cleanup();
        this.detox = null;
      },
    });
  }

  /** @protected */
  registerListeners(map) {
    Object.assign(this._listenerFactories, map);
  }

  /** @private */
  _handleTestEventSync(event, state) {
    const { name } = event;

    for (const listener of this.testEventListeners) {
      if (typeof listener[name] === 'function') {
        listener[name](event, state);
      }
    }
  }

  /** @private */
  _instantiateListeners(detoxInstance) {
    for (const Listener of Object.values(this._listenerFactories)) {
      this.testEventListeners.push(new Listener({
        detox: detoxInstance,
        env: this,
      }));
    }
  }

  /** @private */
  _logError(e) {
    this.detoxContext.log.error(DetoxError.format(e));
  }
}

module.exports = DetoxCircusEnvironment;
