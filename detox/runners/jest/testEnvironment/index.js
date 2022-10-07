const resolveFrom = require('resolve-from');
const maybeNodeEnvironment = require(resolveFrom(process.cwd(), 'jest-environment-node'));
/** @type {typeof import('@jest/environment').JestEnvironment} */
const NodeEnvironment = maybeNodeEnvironment.default || maybeNodeEnvironment;

const detox = require('../../../internals');
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
    this._shouldManageDetox = detox.getStatus() === 'inactive';
    /** @private */
    this._setupFailed = false;
    /** @internal */
    this.testPath = context.testPath;
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.setupTimeout = detox.config.testRunner.jest.setupTimeout;
    /** @protected */
    this.teardownTimeout = detox.config.testRunner.jest.setupTimeout;
    /** @internal */
    log.trace.begin(this.testPath);

    const _setup = this.setup.bind(this);
    this.setup = async () => {
      await log.trace.complete('set up environment', async () => {
        try {
          await Timer.run({
            description: `setting up Detox environment`,
            timeout: this.setupTimeout,
            fn: _setup,
          });
        } catch (e) {
          await this._onSetupFailed(e);
        }
      });
    };

    const _teardown = this.teardown.bind(this);
    this.teardown = async () => {
      try {
        await log.trace.complete('tear down environment', async () => {
          await Timer.run({
            description: `tearing down Detox environment`,
            timeout: this.setupTimeout,
            fn: _teardown,
          });
        });
      } catch (e) {
        await this._onTeardownFailed(e);
      } finally {
        await log.trace.end();
      }
    };

    this.registerListeners({
      DetoxInitErrorListener,
      DetoxPlatformFilterListener,
      DetoxCoreListener,
      SpecReporter,
      WorkerAssignReporter,
    });
  }

  /** @override */
  async setup() {
    await this.initDetox();
    await this._emitCustomEvent('environment_setup');
  }

  handleTestEvent = async (event, state) => {
    const { name } = event;

    if (SYNC_CIRCUS_EVENTS.has(name)) {
      return this._handleTestEventSync(event, state);
    }

    const timer = new Timer({
      description: `handling jest-circus "${name}" event`,
      timeout: state.testTimeout != null ? state.testTimeout : this.setupTimeout,
    });

    try {
      for (const listener of this.testEventListeners) {
        if (typeof listener[name] !== 'function') {
          continue;
        }

        try {
          await timer.run(() => listener[name](event, state));
        } catch (listenerError) {
          log.error(listenerError);
          break;
        }
      }
    } finally {
      this._timer.dispose();
      this._timer = null;
    }
  };

  /** @override */
  async teardown() {
    try {
      if (this._setupFailed) {
        await detox.reportFailedTests([this.testPath], false);
      }
    } finally {
      await this.cleanupDetox();
    }
  }

  /** @protected */
  registerListeners(map) {
    for (const Listener of Object.values(map)) {
      this.testEventListeners.push(new Listener({
        env: this,
      }));
    }
  }

  /**
   * @protected
   */
  async initDetox() {
    const opts = {
      global: this.global,
      workerId: `w${process.env.JEST_WORKER_ID}`,
    };

    if (this._shouldManageDetox) {
      await detox.init(opts);
    } else {
      await detox.installWorker(opts);
    }

    return detox.worker;
  }

  /** @protected */
  async cleanupDetox() {
    if (this._shouldManageDetox) {
      await detox.cleanup();
    } else {
      await detox.uninstallWorker();
    }
  }

  /**
   * @param {Error} e
   * @returns {Promise<void>}
   * @private
   */
  async _onSetupFailed(e) {
    try {
      this._setupFailed = true;

      const timer = new Timer({
        description: `handling DetoxCircusEnvironment#setup() error`,
        timeout: this.teardownTimeout,
      });

      await this._handleTestEventAsync(timer, {
        name: 'environment_setup_failure',
        error: e,
      });
    } finally {
      throw e;
    }
  }

  /**
   * @param {Error} e
   * @returns {Promise<void>}
   * @private
   */
  async _onTeardownFailed(e) {
    try {
      const timer = new Timer({
        description: `handling DetoxCircusEnvironment#teardown() error`,
        timeout: this.teardownTimeout,
      });

      await this._handleTestEventAsync(timer, {
        name: 'environment_setup_failure',
        error: e,
      });
    } finally {
      throw e;
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
  async _handleTestEventAsync(timer, event, state = null) {
    try {
      const { name } = event;

      for (const listener of this.testEventListeners) {
        if (typeof listener[name] === 'function') {
          try {
            await listener[name](event, state);
          } catch (listenerError) {
            log.error(listenerError);
          }
        }
      }
    } finally {
      timer.dispose();
    }
  }

  /**
   * @private
   */
  async _emitCustomEvent(name, ...args) {
  }

}

module.exports = DetoxCircusEnvironment;
