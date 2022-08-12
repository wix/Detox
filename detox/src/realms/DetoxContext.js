const funpermaproxy = require('funpermaproxy');

const { DetoxRuntimeError } = require('../errors');
const DetoxLogger = require('../logger/DetoxLogger');
const DetoxTracer = require('../logger/DetoxTracer');
const symbols = require('../symbols');

const DetoxConstants = require('./DetoxConstants');

const $cleanup = Symbol('cleanup');
const $logger = Symbol('logger');
const $restoreSessionState = Symbol('restoreSessionState');
const $sessionState = Symbol('restoreSessionState');
const $tracer = Symbol('tracer');

const _worker = Symbol('worker');

class DetoxContext {
  constructor() {
    this[symbols.globalSetup] = this[symbols.globalSetup].bind(this);
    this[symbols.globalTeardown] = this[symbols.globalTeardown].bind(this);
    this[symbols.reportFailedTests] = this[symbols.reportFailedTests].bind(this);
    this[symbols.resolveConfig] = this[symbols.resolveConfig].bind(this);
    this[symbols.setup] = this[symbols.setup].bind(this);
    this[symbols.teardown] = this[symbols.teardown].bind(this);

    this[$sessionState] = this[$restoreSessionState]();

    const loggerConfig = this[$sessionState].detoxConfig
      ? this[$sessionState].detoxConfig.logger
      : undefined;

    /**
     * @protected
     * @type {DetoxLogger & Detox.Logger}
     */
    this[$logger] = new DetoxLogger(loggerConfig);
    /** @protected */
    this[$tracer] = DetoxTracer.default({
      logger: this[$logger],
    });
    /** @deprecated */
    this.traceCall = this[$tracer].bind(this[$tracer]);
    /** @type {import('../DetoxWorker') | null} */
    this[_worker] = null;
  }

  //#region Public members
  device = funpermaproxy(() => this[symbols.worker].device);

  element = funpermaproxy.callable(() => this[symbols.worker].element);

  waitFor = funpermaproxy.callable(() => this[symbols.worker].waitFor);

  expect = funpermaproxy.callable(() => this[symbols.worker].expect);

  by = funpermaproxy(() => this[symbols.worker].by);

  web = funpermaproxy.callable(() => this[symbols.worker].web);

  get DetoxConstants() {
    return DetoxConstants;
  }

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
  [symbols.reportFailedTests](_testFilePaths, _permanent) {}
  /**
   * @abstract
   * @param {Partial<DetoxInternals.DetoxGlobalSetupOptions>} _opts
   * @returns {Promise<DetoxInternals.RuntimeConfig>}
   */
  async [symbols.resolveConfig](_opts) { return null; }

  get [symbols.worker]() {
    if (!this[_worker]) {
      throw new DetoxRuntimeError({
        message: `Detox worker instance has not been initialized in this context (${this.constructor.name}).`,
        hint: DetoxRuntimeError.reportIssueIfJest + '\n' + 'Otherwise, make sure you call detox.setup() beforehand.',
      });
    }

    return this[_worker];
  }

  /**
   * @abstract
   * @param {Partial<DetoxInternals.DetoxGlobalSetupOptions>} [_opts]
   * @returns {Promise<void>}
   */
  async [symbols.globalSetup](_opts = {}) {}

  /**
   * @param {Partial<DetoxInternals.DetoxConfigurationSetupOptions>} [opts]
   */
  async [symbols.setup](opts) {
    const theGlobal = opts.global || global;
    theGlobal['__detox__'] = this;
    this[$logger].overrideConsole(theGlobal);

    const DetoxWorker = require('../DetoxWorker');
    DetoxWorker.global = theGlobal;
    this[_worker] = new DetoxWorker(this);
    await this[_worker].init();
  }

  async [symbols.teardown]() {
    try {
      if (this[_worker]) {
        await this[_worker].cleanup();
      }
    } finally {
      this[_worker] = null;
    }
  }

  /**
   * @abstract
   */
  async [symbols.globalTeardown]() {}
  //#endregion

  //#region Protected members
  /**
   * @abstract
   * @protected
   */
  [$restoreSessionState]() {
    return null;
  }
  //#endregion
}

module.exports = DetoxContext;
module.exports.protected = {
  $cleanup,
  $logger,
  $restoreSessionState,
  $sessionState,
  $tracer,
};
