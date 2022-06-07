const funpermaproxy = require('funpermaproxy');

const { DetoxRuntimeError } = require('./errors');
const NullLogger = require('./logger/NullLogger');

class DetoxSecondaryContext {
  constructor() {
    this.setup = this.setup.bind(this);
    this.teardown = this.teardown.bind(this);

    /**
     * @protected
     * @type {*}
     */
    this._ipc = null;
    /**
     * @protected
     * @type {Detox.Logger}
     */
    this._logger = new NullLogger();
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
    this.element = funpermaproxy(() => this.worker.element);
    this.waitFor = funpermaproxy(() => this.worker.waitFor);
    this.expect = funpermaproxy(() => this.worker.expect);
    this.by = funpermaproxy(() => this.worker.by);
    this.web = funpermaproxy(() => this.worker.web);
  }

  /**
   * @param {Detox.DetoxInitOptions} [opts]
   * @returns {Promise<import('./DetoxWorker') | null>}
   */
  async setup(opts) {
    try {
      await this._doSetup(opts);
      return this._worker;
    } catch (e) {
      await this.teardown();
      throw e;
    }
  }

  /**
   * @protected
   * @param {Detox.DetoxInitOptions} [opts]
   * @returns {Promise<void>}
   */
  async _doSetup(opts) {
    this._ipc = require('./ipc/client');
    await this._ipc.setup();

    this._config = await this._ipc.getDetoxConfig();

    const IPCLogger = require('./logger/IPCLogger');
    this._logger = new IPCLogger({
      level: this._config.cliConfig.loglevel,
    });

    await this._allocateWorker(opts);
  }

  /**
   * @protected
   * @param {Detox.DetoxInitOptions} [opts]
   * @returns {Promise<void>}
   */
  async _allocateWorker(opts) {
    if (opts.workerId > 0) {
      const DetoxWorker = require('./DetoxWorker');
      DetoxWorker.global = global;
      this._worker = new DetoxWorker();
      await this._worker.setup();
    }
  }

  async teardown() {
    if (this._worker) {
      await this._worker.teardown();
      this._worker = null;
    }

    await this._doTeardown();

    if (!(this._logger instanceof NullLogger)) {
      this._logger = new NullLogger(); // TODO: set loglevel
    }
  }

  /**
   * @protected
   */
  async _doTeardown() {
    if (this._ipc) {
      await this._ipc.teardown();
      this._ipc = null;
    }
  }

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

module.exports = DetoxSecondaryContext;
