const path = require('path');

const WithEmitter = require('jest-environment-emit').default;
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
class DetoxCircusEnvironment extends WithEmitter(NodeEnvironment) {
  constructor(config, context) {
    super(assertJestCircus27(config), assertExistingContext(context));

    /** @private */
    this._shouldManageDetox = detox.getStatus() === 'inactive';
    /** @private */
    this._timer = new Timer();

    /** @internal */
    this.testPath = path.relative(process.cwd(), context.testPath);
    /** @protected */
    this.testEventListeners = [];
    /** @protected */
    this.setupTimeout = detox.config.testRunner.jest.setupTimeout;
    /** @protected */
    this.teardownTimeout = detox.config.testRunner.jest.teardownTimeout;

    log.trace.begin(this.testPath);

    this.handleTestEvent = this.handleTestEvent.bind(this);
    this.setup = this._wrapSetup(this.setup);
    this.teardown = this._wrapTeardown(this.teardown);

    this.registerListeners({
      DetoxInitErrorListener,
      DetoxPlatformFilterListener,
      DetoxCoreListener,
      SpecReporter,
      WorkerAssignReporter,
    });

    // Artifacts flushing should be delayed to avoid conflicts with third-party reporters
    this.testEvents.on('*', this._onTestEvent.bind(this), 1e6);
  }

  /** @override */
  async setup() {
    await super.setup();
    await this.initDetox();
  }

  // @ts-expect-error TS2425
  async handleTestEvent(event, state) {
    // @ts-expect-error TS2855
    await super.handleTestEvent(event, state);

    if (detox.session.unsafe_earlyTeardown) {
      if (event.name === 'test_fn_start' || event.name === 'hook_start') {
        throw new Error('Detox halted test execution due to an early teardown request');
      }
    }
  }

  /** @override */
  async teardown() {
    try {
      await this.cleanupDetox();
    } finally {
      await super.teardown();
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
    if (detox.session.unsafe_earlyTeardown) {
      throw new Error('Detox halted test execution due to an early teardown request');
    }

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
  _onTestEvent({ type, event, state }) {
    const timeout = state && state.testTimeout != null ? state.testTimeout : this.setupTimeout;

    this._timer.schedule(timeout);

    if (event) {
      if (SYNC_CIRCUS_EVENTS.has(event.name)) {
        this._handleTestEventSync(event, state);
      } else {
        return this._handleTestEventAsync(event, state);
      }
    } else {
      return this._handleTestEventAsync({ name: type }, null);
    }
  }

  /** @private */
  async _handleTestEventAsync(event, state = null) {
    const description = `handling ${state ? 'jest-circus' : 'jest-environment'} "${event.name}" event`;

    for (const listener of this.testEventListeners) {
      if (typeof listener[event.name] !== 'function') {
        continue;
      }

      try {
        await this._timer.run(description, () => listener[event.name](event, state));
      } catch (listenerError) {
        log.error(listenerError);
        if (this._timer.expired) {
          break;
        }
      }
    }
  }

  _wrapSetup(fn) {
    const _setup = fn.bind(this);

    return async () => {
      await log.trace.complete('set up environment', async () => {
        try {
          this._timer.schedule(this.setupTimeout);
          await this._handleTestEventAsync({ name: 'environment_setup_start' });
          await this._timer.run(`setting up Detox environment`, _setup);
          await this._handleTestEventAsync({ name: 'environment_setup_success' });
        } catch (error) {
          this._timer.schedule(this.teardownTimeout);
          await this._handleTestEventAsync({ name: 'environment_setup_failure', error });
          throw error;
        } finally {
          this._timer.clear();
        }
      });
    };
  }

  _wrapTeardown(fn) {
    const _teardown = fn.bind(this);

    return async () => {
      await log.trace.complete('tear down environment', async () => {
        try {
          this._timer.schedule(this.teardownTimeout);
          await this._handleTestEventAsync({ name: 'environment_teardown_start' });
          await this._timer.run(`tearing down Detox environment`, _teardown);
          await this._handleTestEventAsync({ name: 'environment_teardown_success' });
        } catch (error) {
          if (this._timer.expired) {
            this._timer.schedule(this.teardownTimeout);
          }

          await this._handleTestEventAsync({ name: 'environment_teardown_failure', error });
          throw error;
        } finally {
          this._timer.clear();
          log.trace.end();
        }
      });
    };
  }
}

module.exports = DetoxCircusEnvironment;
