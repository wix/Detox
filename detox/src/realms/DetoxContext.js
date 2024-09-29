const funpermaproxy = require('funpermaproxy');

const temporary = require('../artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('../errors');
const { DetoxLogger, DetoxLogFinalizer, installLegacyTracerInterface } = require('../logger');

const DetoxConstants = require('./DetoxConstants');
const symbols = require('./symbols');

//#region Protected symbols
const $cleanup = Symbol('cleanup');
const $logFinalizer = Symbol('logFinalizer');
const $restoreSessionState = Symbol('restoreSessionState');
const $sessionState = Symbol('restoreSessionState');
const $status = Symbol('status');
const $worker = Symbol('worker');
//#endregion

class DetoxContext {
  constructor() {
    /** @type {DetoxInternals.DetoxStatus} */
    this[$status] = 'inactive';

    const _init = this[symbols.init].bind(this);
    this[symbols.init] = async (opts) => {
      this[$status] = 'init';
      await _init(opts);
      this[$status] = 'active';
    };

    const _cleanup = this[symbols.cleanup].bind(this);
    this[symbols.cleanup] = async () => {
      this[$status] = 'cleanup';
      try {
        await _cleanup();
      } finally {
        this[$status] = 'inactive';
      }
    };

    this[symbols.getStatus] = this[symbols.getStatus].bind(this);
    this[symbols.reportTestResults] = this[symbols.reportTestResults].bind(this);
    this[symbols.resolveConfig] = this[symbols.resolveConfig].bind(this);
    this[symbols.installWorker] = this[symbols.installWorker].bind(this);
    this[symbols.uninstallWorker] = this[symbols.uninstallWorker].bind(this);

    this[$sessionState] = this[$restoreSessionState]();

    /**
     * @type {import('../logger/').DetoxLogger & Detox.Logger}
     */
    this[symbols.logger] = new DetoxLogger({
      file: temporary.for.jsonl(`${this[$sessionState].id}.${process.pid}`),
      userConfig: this[$sessionState].detoxConfig
        ? this[$sessionState].detoxConfig.logger
        : null,
    });

    this.log = this[symbols.logger].child({ cat: 'user' });
    installLegacyTracerInterface(this.log, this);

    this[$logFinalizer] = new DetoxLogFinalizer({
      session: this[$sessionState],
      logger: this[symbols.logger],
    });

    /** @type {import('../DetoxWorker') | null} */
    this[$worker] = null;
  }

  //#region Public members
  device = funpermaproxy(() => this[symbols.worker].device);

  element = funpermaproxy.callable(() => this[symbols.worker].element);

  waitFor = funpermaproxy.callable(() => this[symbols.worker].waitFor);

  expect = funpermaproxy.callable(() => this[symbols.worker].expect);

  by = funpermaproxy(() => this[symbols.worker].by);

  web = funpermaproxy.callable(() => this[symbols.worker].web);

  system = funpermaproxy.callable(() => this[symbols.worker].system);

  copilot = funpermaproxy.callable(() => this[symbols.worker].copilot);

  get DetoxConstants() {
    return DetoxConstants;
  }

  //#endregion

  //#region Internal members
  [symbols.onRunDescribeStart] = (...args) => this[symbols.worker].onRunDescribeStart(...args);
  [symbols.onTestStart] = (...args) => this[symbols.worker].onTestStart(...args);
  [symbols.onHookFailure] = (...args) => this[symbols.worker].onHookFailure(...args);
  [symbols.onTestFnFailure] = (...args) => this[symbols.worker].onTestFnFailure(...args);
  [symbols.onTestDone] = (...args) => this[symbols.worker].onTestDone(...args);
  [symbols.onRunDescribeFinish] = (...args) => this[symbols.worker].onRunDescribeFinish(...args);
  [symbols.config] = funpermaproxy(() => this[symbols.session].detoxConfig);
  [symbols.session] = funpermaproxy(() => this[$sessionState]);
  [symbols.tracing] = Object.freeze({
    createEventStream: () => this[$logFinalizer].createEventStream(),
  });
  /** @abstract */
  [symbols.reportTestResults](_testResults) {}
  /** @abstract */
  [symbols.conductEarlyTeardown](_permanent) {}
  /**
   * @abstract
   * @param {Partial<DetoxInternals.DetoxInitOptions>} _opts
   * @returns {Promise<DetoxInternals.RuntimeConfig>}
   */
  async [symbols.resolveConfig](_opts) { return null; }

  [symbols.getStatus]() {
    return this[$status];
  }

  get [symbols.worker]() {
    if (!this[$worker]) {
      throw new DetoxRuntimeError({
        message: `Detox worker instance has not been installed in this context (${this.constructor.name}).`,
        hint: DetoxRuntimeError.reportIssueIfJest + '\n' + 'Otherwise, make sure you call detox.installWorker() beforehand.',
      });
    }

    return this[$worker];
  }

  /**
   * @abstract
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [_opts]
   * @returns {Promise<void>}
   */
  async [symbols.init](_opts = {}) {}

  /**
   * @param {Partial<DetoxInternals.DetoxInstallWorkerOptions>} [opts]
   */
  async [symbols.installWorker](opts) {
    if (opts.global) {
      opts.global['__detox__'] = {
        clientApi: require('../../index'),
        internalsApi: require('../../internals'),
      };
      this.log.overrideConsole(opts.global);
    }

    const DetoxWorker = require('../DetoxWorker');
    DetoxWorker.global = opts.global || global;
    this[$worker] = new DetoxWorker(this);
    this[$worker].id = opts.workerId;
    await this[$worker].init();
  }

  /** @abstract */
  async [symbols.allocateDevice](_deviceConfig) {}

  /** @abstract */
  async [symbols.deallocateDevice](_deviceCookie) {}

  async [symbols.uninstallWorker]() {
    try {
      if (this[$worker]) {
        await this[$worker].cleanup();
      }
    } finally {
      this[$worker] = null;
    }
  }

  /**
   * @abstract
   */
  async [symbols.cleanup]() {}
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
  $logFinalizer,
  $restoreSessionState,
  $status,
  $sessionState,
  $worker,
};
