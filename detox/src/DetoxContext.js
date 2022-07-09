const funpermaproxy = require('funpermaproxy');

const temporaryPath = require('./artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('./errors');
const DetoxLogger = require('./logger/DetoxLogger');
const DetoxTracer = require('./logger/DetoxTracer');
const customConsoleLogger = require('./logger/customConsoleLogger');
const symbols = require('./symbols');

const $cleanup = Symbol('cleanup');
const $init = Symbol('init');
const $initWorker = Symbol('initWorker');
const $logger = Symbol('logger');
const $restoreSessionState = Symbol('restoreSessionState');
const $sessionState = Symbol('restoreSessionState');
const $tracer = Symbol('tracer');
const _cleanupFn = Symbol('cleanupFn');
const _cleanupPromise = Symbol('cleanupPromise');
const _initFn = Symbol('initFn');
const _initPromise = Symbol('initPromise');
const _initWorkerPromise = Symbol('initWorkerPromise');
const _injectToSandbox = Symbol('initWorker');
const _worker = Symbol('worker');

class DetoxContext {
  constructor() {
    this[$sessionState] = this[$restoreSessionState]();

    const loggerConfig = this[$sessionState].detoxConfig
      ? this[$sessionState].detoxConfig.loggerConfig
      : undefined;

    /**
     * @protected
     * @type {DetoxLogger & Detox.Logger}
     */
    this[$logger] = new DetoxLogger({
      ...loggerConfig,
      file: temporaryPath.for.log(),
    });
    /** @protected */
    this[$tracer] = DetoxTracer.default({
      logger: this[$logger],
    });
    /** @deprecated */
    this.traceCall = this[$tracer].bind(this[$tracer]);
    /** @type {import('./DetoxWorker') | null} */
    this[_worker] = null;
    /** @type {Promise | null} */
    this[_initPromise] = null;
    /** @type {Promise | null} */
    this[_initWorkerPromise] = null;
    /** @type {Promise | null} */
    this[_cleanupPromise] = null;
  }

  //#region Public members
  device = funpermaproxy(() => this[symbols.worker].device);

  element = funpermaproxy.callable(() => this[symbols.worker].element);

  waitFor = funpermaproxy.callable(() => this[symbols.worker].waitFor);

  expect = funpermaproxy.callable(() => this[symbols.worker].expect);

  by = funpermaproxy(() => this[symbols.worker].by);

  web = funpermaproxy.callable(() => this[symbols.worker].web);

  /**
   * @returns {Detox.Logger}
   */
  get log() {
    return this[$logger];
  }

  /**
   * @returns {Detox.Tracer}
   */
  get trace() {
    return this[$tracer];
  }
  //#endregion

  //#region Internal members
  [symbols.onRunStart] = (...args) => this[symbols.worker].onRunStart(...args);
  [symbols.onRunDescribeStart] = (...args) => this[symbols.worker].onRunDescribeStart(...args);
  [symbols.onTestStart] = (...args) => this[symbols.worker].onTestStart(...args);
  [symbols.onHookStart] = (...args) => this[symbols.worker].onHookStart(...args);
  [symbols.onHookFailure] = (...args) => this[symbols.worker].onHookFailure(...args);
  [symbols.onHookSuccess] = (...args) => this[symbols.worker].onHookSuccess(...args);
  [symbols.onTestFnStart] = (...args) => this[symbols.worker].onTestFnStart(...args);
  [symbols.onTestFnFailure] = (...args) => this[symbols.worker].onTestFnFailure(...args);
  [symbols.onTestFnSuccess] = (...args) => this[symbols.worker].onTestFnSuccess(...args);
  [symbols.onTestDone] = (...args) => this[symbols.worker].onTestDone(...args);
  [symbols.onRunDescribeFinish] = (...args) => this[symbols.worker].onRunDescribeFinish(...args);
  [symbols.onRunFinish] = (...args) => this[symbols.worker].onRunFinish(...args);
  [symbols.config] = funpermaproxy(() => this[symbols.session].detoxConfig);
  [symbols.session] = funpermaproxy(() => this[$sessionState]);
  /** @abstract */
  [symbols.reportFailedTests](_testFilePaths) {}
  get [symbols.worker]() {
    if (!this[_worker]) {
      throw new DetoxRuntimeError({
        message: `Detox worker instance has not been initialized in this context (${this.constructor.name}).`,
        hint: DetoxRuntimeError.reportIssueIfJest,
      });
    }

    return this[_worker];
  }
  /**
   * @async
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  [symbols.init] = (opts = {}) => {
    if (this[_cleanupPromise]) {
      return Promise.reject(new DetoxRuntimeError({
        message: 'Cannot init while in cleanup TODO',
      }));
    }

    if (!this[_initPromise]) {
      this[_initPromise] = this[$init](opts);
    }

    if (opts.global) {
      this[_initPromise] = this[_initPromise].then(() => {
        this[_injectToSandbox](opts.global);
      });
    }

    if (opts.workerId != null) {
      if (!this[_initWorkerPromise]) {
        this[_initWorkerPromise] = this[_initPromise].then(() => this[$initWorker](opts));
      }
    }

    return this[_initWorkerPromise] || this[_initPromise];
  };

  [symbols.cleanup] = async () => {
    if (!this[_cleanupPromise]) {
      this[_cleanupPromise] = this[_cleanupFn]();
    }

    return this[_cleanupPromise];
  };
  //#endregion

  //#region Protected members
  /**
   * @abstract
   * @protected
   * @param {Partial<DetoxInternals.DetoxInitOptions>} _opts
   */
  async [$init](_opts) {}

  /**
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  async [$initWorker](opts) {
    const DetoxWorker = require('./DetoxWorker');
    DetoxWorker.global = opts.global || global;
    this[_worker] = new DetoxWorker(this);
    await this[_worker].init();
  }

  /**
   * @protected
   */
  [$restoreSessionState]() {
    return null;
  }

  /**
   * @abstract
   * @protected
   */
  async [$cleanup]() {}
  //#endregion

  //#region Private members
  async [_initFn](opts) {
    await this[$init](opts);
  }

  [_injectToSandbox](global) {
    global['__detox__'] = this;

    if (this[symbols.config].loggerConfig.overrideConsole) {
      customConsoleLogger.overrideConsoleMethods(global.console, this[$logger]);
    }
  }

  async [_cleanupFn]() {
    try {
      try {
        if (this[_worker]) {
          await this[_worker].cleanup();
        }
      } finally {
        this[_worker] = null;
        this[_initWorkerPromise] = null;
        await this[$cleanup]();
      }
    } finally {
      this[_cleanupPromise] = null;
      this[_initPromise] = null;
    }
  }
  //#endregion
}

module.exports = DetoxContext;
module.exports.protected = {
  $cleanup,
  $init,
  $initWorker,
  $logger,
  $restoreSessionState,
  $sessionState,
  $tracer,
};
