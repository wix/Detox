const funpermaproxy = require('funpermaproxy');

const temporaryPath = require('./artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('./errors');
const DetoxLogger = require('./logger/DetoxLogger');
const DetoxTracer = require('./logger/DetoxTracer');
const customConsoleLogger = require('./logger/customConsoleLogger');
const symbols = require('./symbols');

const $_worker = Symbol('_worker');
const $initFn = Symbol('initFn');
const $initPromise = Symbol('initPromise');
const $initWorkerPromise = Symbol('initWorkerPromise');
const $initWorker = Symbol('initWorker');
const $injectToSandbox = Symbol('initWorker');
const $cleanupFn = Symbol('cleanupFn');
const $cleanupPromise = Symbol('cleanupPromise');

class DetoxContext {
  constructor() {
    this._sessionState = this._restoreSessionState();

    const loggerConfig = this._sessionState.detoxConfig
      ? this._sessionState.detoxConfig.loggerConfig
      : undefined;

    /**
     * @protected
     * @type {DetoxLogger & Detox.Logger}
     */
    this._logger = new DetoxLogger({
      ...loggerConfig,
      file: temporaryPath.for.log(),
    });
    /** @protected */
    this._tracer = DetoxTracer.default({
      logger: this._logger,
    });
    /** @deprecated */
    this.traceCall = this._tracer.bind(this._tracer);
    /** @type {import('./DetoxWorker') | null} */
    this[$_worker] = null;
    /** @type {Promise | null} */
    this[$initPromise] = null;
    /** @type {Promise | null} */
    this[$initWorkerPromise] = null;
    /** @type {Promise | null} */
    this[$cleanupPromise] = null;
  }

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
  [symbols.session] = funpermaproxy(() => this._sessionState);
  /** @abstract */
  [symbols.reportFailedTests](_testFilePaths) {}
  get [symbols.worker]() {
    if (!this[$_worker]) {
      throw new DetoxRuntimeError({
        message: `Detox worker instance has not been initialized in this context (${this.constructor.name}).`,
        hint: DetoxRuntimeError.reportIssueIfJest,
      });
    }

    return this[$_worker];
  }
  //#endregion

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
    return this._logger;
  }

  /**
   * @returns {Detox.Tracer}
   */
  get trace() {
    return this._tracer;
  }

  /**
   * @async
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  [symbols.init] = (opts = {}) => {
    if (this[$cleanupPromise]) {
      return Promise.reject(new DetoxRuntimeError({
        message: 'Cannot init while in cleanup TODO',
      }));
    }

    if (!this[$initPromise]) {
      this[$initPromise] = this[$initFn](opts);
    }

    if (opts.global) {
      this[$initPromise] = this[$initPromise].then(() => {
        this[$injectToSandbox](opts.global);
      });
    }

    if (opts.workerId != null) {
      if (!this[$initWorkerPromise]) {
        this[$initWorkerPromise] = this[$initPromise].then(() => this[$initWorker](opts));
      }
    }

    return this[$initWorkerPromise] || this[$initPromise];
  };

  [symbols.cleanup] = async () => {
    if (!this[$cleanupPromise]) {
      this[$cleanupPromise] = this[$cleanupFn]();
    }

    return this[$cleanupPromise];
  };

  //#endregion

  /**
   * @param {Partial<DetoxInternals.DetoxInitOptions>} opts
   */
  [$initFn] = async (opts) => {
    try {
      await this._doInit(opts);
    } catch (e) {
      await this[symbols.cleanup]();
      throw e;
    }
  };

  [$injectToSandbox](global) {
    global['__detox__'] = this;

    if (this[symbols.config].loggerConfig.overrideConsole) {
      customConsoleLogger.overrideConsoleMethods(global.console, this._logger);
    }
  }

  /**
   * @param {Partial<DetoxInternals.DetoxInitWorkerOptions>} [opts]
   * @returns {Promise<void>}
   */
  [$initWorker] = async (opts) => {
    const DetoxWorker = require('./DetoxWorker');
    DetoxWorker.global = opts.global || global;
    this[$_worker] = new DetoxWorker(this);
    await this[$_worker].init();
  };

  [$cleanupFn] = async () => {
    try {
      try {
        if (this[$_worker]) {
          await this[$_worker].cleanup();
        }
      } finally {
        this[$_worker] = null;
        this[$initWorkerPromise] = null;
        await this._doCleanup();
      }
    } finally {
      this[$cleanupPromise] = null;
      this[$initPromise] = null;
    }
  };

  /**
   * @abstract
   * @protected
   * @param {Partial<DetoxInternals.DetoxInitOptions>} _opts
   */
  async _doInit(_opts) {}

  /**
   * @protected
   */
  _restoreSessionState() {
    return null;
  }

  /**
   * @abstract
   * @protected
   */
  async _doCleanup() {}
}

module.exports = DetoxContext;
