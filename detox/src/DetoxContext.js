const funpermaproxy = require('funpermaproxy');

const temporaryPath = require('./artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('./errors');
const DetoxLogger = require('./logger/DetoxLogger');
const DetoxTracer = require('./logger/DetoxTracer');
const customConsoleLogger = require('./logger/customConsoleLogger');
const symbols = require('./symbols');

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
    /**
     * @protected
     * @type {import('./DetoxWorker') | null}
     */
    this._worker = null;
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
    if (!this._worker) {
      throw new DetoxRuntimeError({
        message: 'Detox worker instance has not been initialized in this context.',
      });
    }

    return this._worker;
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
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  [symbols.init] = async (opts = {}) => {
    try {
      await this._doInit(opts);
      await this._allocateWorker(opts);
      this._injectIntoSandbox(opts);
    } catch (e) {
      await this[symbols.cleanup]();
      throw e;
    }
  };

  [symbols.cleanup] = async () => {
    try {
      if (this._worker) {
        await this._worker.cleanup();
        this._worker = null;
      }
    } finally {
      await this._doCleanup();
    }
  };

  //#endregion

  /**
   * @abstract
   * @protected
   * @param {Partial<DetoxInternals.DetoxInitOptions>} _opts
   */
  async _doInit(_opts) {}

  /**
   * @protected
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  async _allocateWorker(opts) {
    if (this._worker) {
      return;
    }

    if (opts.workerId) {
      const DetoxWorker = require('./DetoxWorker');
      DetoxWorker.global = opts.global || global;
      this._worker = new DetoxWorker(this);
      await this._worker.init();
    }
  }

  _injectIntoSandbox(opts) {
    if (opts.global) {
      if (!opts.global['__detox__']) {
        opts.global['__detox__'] = this;
      }

      customConsoleLogger.overrideConsoleMethods(opts.global.console, this._logger);
    }
  }

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
