// @ts-nocheck
const maybeNodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const NodeEnvironment = maybeNodeEnvironment.default || maybeNodeEnvironment;

const detox = require('../../../internals');
const { DetoxError } = require('../../../src/errors');
const Timer = require('../../../src/utils/Timer');

const {
  DetoxCoreListener,
  DetoxInitErrorListener,
  DetoxPlatformFilterListener,
  SpecReporter,
  WorkerAssignReporter
} = require('./listeners');
const assertExistingContext = require('./utils/assertExistingContext');
const { assertJestCircus27 } = require('./utils/assertJestCircus27');

const SYNC_CIRCUS_EVENTS = new Set([
  'start_describe_definition',
  'finish_describe_definition',
  'add_hook',
  'add_test',
  'error',
]);

const log = detox.log.child({ cat: 'lifecycle,jest-environment' });

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
      SpecReporter,
      WorkerAssignReporter,
    };
    /** @private */
    this._shouldManageDetox = detox.getStatus() === 'inactive';
    /** @internal */
    this.testPath = context.testPath;
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.initTimeout = detox.config.testRunner.jest.initTimeout;
    /** @internal */
    log.trace.begin(this.testPath);

    this.setup = log.trace.complete.bind(null, 'set up environment', this.setup.bind(this));
    this.teardown = async () => {
      try {
        await log.trace.complete('tear down environment', this.teardown.bind(this));
      } finally {
        await log.trace.end();
      }
    };
  }

  /** @override */
  async setup() {
    await super.setup();
    await Timer.run({
      description: `setting up Detox environment`,
      timeout: this.initTimeout,
      fn: async () => {
        await this.initDetox();
        this._instantiateListeners();
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
          log.error(listenerError);
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
      fn: async () => await this.cleanupDetox(),
    });
  }

  /** @protected */
  registerListeners(map) {
    Object.assign(this._listenerFactories, map);
  }

  /**
   * @protected
   */
  async initDetox() {
    const opts = {
      global: this.global,
      workerId: `worker-${process.env.JEST_WORKER_ID}`,
    };

    if (this._shouldManageDetox) {
      await detox.init(opts);
    } else {
      await detox.installWorker(opts);
    }
  }

  /** @protected */
  async cleanupDetox() {
    if (this._shouldManageDetox) {
      await detox.cleanup();
    } else {
      await detox.uninstallWorker();
    }
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
  _instantiateListeners() {
    for (const Listener of Object.values(this._listenerFactories)) {
      this.testEventListeners.push(new Listener({
        env: this,
      }));
    }
  }
}

module.exports = DetoxCircusEnvironment;
