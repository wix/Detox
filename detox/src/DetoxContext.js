const funpermaproxy = require('funpermaproxy');

const temporaryPath = require('./artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('./errors');
const DetoxLogger = require('./utils/DetoxLogger');

class DetoxContext {
  constructor() {
    this.init = this.init.bind(this);
    this.cleanup = this.cleanup.bind(this);

    /**
     * @protected
     * @type {DetoxLogger}
     */
    this._logger = new DetoxLogger({
      level: DetoxLogger.castLevel(process.env.DETOX_LOGLEVEL),
      file: temporaryPath.for.log(),
    });
    /**
     * @protected
     * @type {import('./DetoxWorker') | null}
     */
    this._worker = null;
    /**
     * @type {*}
     * @protected
     */
    this._config = null;

    this.config = funpermaproxy(() => this._config);
    this.log = funpermaproxy(() => this._logger);
    this.device = funpermaproxy(() => this.worker.device);
    this.element = funpermaproxy.callable(() => this.worker.element);
    this.waitFor = funpermaproxy.callable(() => this.worker.waitFor);
    this.expect = funpermaproxy.callable(() => this.worker.expect);
    this.by = funpermaproxy(() => this.worker.by);
    this.web = funpermaproxy.callable(() => this.worker.web);
  }

  /**
   * @abstract
   * @protected
   * @param {Partial<Detox.DetoxInitOptions>} [opts]
   * @returns {Promise<Detox.DetoxInstance>}
   */
  async init(opts = {}) {
    try {
      this._injectIntoSandbox(opts);
      await this._doInit(opts);
      await this._allocateWorker(opts);
      return this._worker;
    } catch (e) {
      await this.cleanup();
      throw e;
    }
  }

  /**
   * @abstract
   * @protected
   * @param {Partial<Detox.DetoxInitOptions>} _opts
   */
  async _doInit(_opts) {}

  /**
   * @protected
   * @param {Partial<Detox.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  async _allocateWorker(opts) {
    if (opts.workerId) {
      const DetoxWorker = require('./DetoxWorker');
      DetoxWorker.global = opts.global || global;
      this._worker = new DetoxWorker(this);
      await this._worker.init();
    }
  }

  _injectIntoSandbox(opts) {
    if (opts.global && !opts.global['__detox__']) {
      opts.global['__detox__'] = this;
    }
  }

  async cleanup() {
    try {
      if (this._worker) {
        await this._worker.cleanup();
        this._worker = null;
      }
    } finally {
      await this._doCleanup();
    }
  }

  /**
   * @abstract
   * @protected
   */
  async _doCleanup() {}

  /**
   * @protected
   * @type {Detox.DetoxInstance}
   */
  get worker() {
    if (!this._worker) {
      throw new DetoxRuntimeError({
        message: 'Detox worker instance has not been initialized in this context.',
      });
    }

    return this._worker;
  }
}

module.exports = DetoxContext;
