const funpermaproxy = require('funpermaproxy');

const { DetoxRuntimeError } = require('./errors');
const IPCLogger = require('./logger/IPCLogger');

class DetoxSecondaryContext {
  constructor() {
    this.setup = this.setup.bind(this);
    this.teardown = this.teardown.bind(this);

    /**
     * @protected
     * @type {*}
     */
    this._ipc = null;

    // eslint-disable-next-line unicorn/no-this-assignment
    const context = this;

    /**
     * @protected
     * @type {Detox.Logger}
     */
    this._logger = new IPCLogger({
      queue: [],

      get level() {
        return context._config ? context._config.cliConfig.loglevel : 'info';
      },

      get client() {
        return this._ipc;
      },
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
    this.element = funpermaproxy(() => this.worker.element);
    this.waitFor = funpermaproxy(() => this.worker.waitFor);
    this.expect = funpermaproxy(() => this.worker.expect);
    this.by = funpermaproxy(() => this.worker.by);
    this.web = funpermaproxy(() => this.worker.web);
  }

  /**
   * @param {Partial<Detox.DetoxInitOptions>} [opts]
   * @returns {Promise<import('./DetoxWorker') | null>}
   */
  async setup(opts) {
    try {
      await this._doSetup(opts || {});
      return this._worker;
    } catch (e) {
      await this.teardown();
      throw e;
    }
  }

  /**
   * @protected
   * @param {Partial<Detox.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  async _doSetup(opts) {
    const IPCClient = require('./ipc/IPCClient');
    this._ipc = new IPCClient({
      serverId: process.env.DETOX_IPC_SERVER_ID,
      workerId: opts.workerId,
    });

    await this._ipc.setup();

    this._config = await this._ipc.getDetoxConfig();

    await this._allocateWorker(opts);

    if (opts.global && !opts.global['__detox__']) {
      opts.global['__detox__'] = this;
    }
  }

  /**
   * @protected
   * @param {Partial<Detox.DetoxInitOptions>} [opts]
   * @returns {Promise<void>}
   */
  async _allocateWorker(opts) {
    if (opts.workerId > 0) {
      const DetoxWorker = require('./DetoxWorker');
      DetoxWorker.global = opts.global || global;
      this._worker = new DetoxWorker(this);
      await this._worker.setup();
    }
  }

  async teardown() {
    if (this._worker) {
      await this._worker.teardown();
      this._worker = null;
    }

    await this._doTeardown();
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
