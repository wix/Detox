const ipcClient = require('./ipc/client');
const IPCLogger = require('./logger/IPCLogger');
const NullLogger = require('./logger/NullLogger');

class DetoxSecondaryContext {
  constructor() {
    this.setup = this.setup.bind(this);
    this.teardown = this.teardown.bind(this);
    /** @type {NullLogger | IPCLogger} */
    this._logger = new NullLogger();
    this._fingerprint = Math.random();
    this._ready = false;
    this._config = null;
  }

  async setup() {
    if (this._ready) {
      return;
    }

    await ipcClient.setup();
    this._config = await ipcClient.getDetoxConfig();
    this._logger = new IPCLogger({
      level: this._config.cliConfig.loglevel,
    });
    this._ready = true;
  }

  async allocateWorker(opts) {
    const DetoxWorker = require('./DetoxWorker');
    DetoxWorker.global = opts.global || global;

    // TODO: implement timeout
    const context = new DetoxWorker();
    try {
      await context.setup();
      return context;
    } catch (e) {
      await context.teardown();
    }
  }

  async teardown() {
    this._ready = false;
    await ipcClient.teardown();
  }

  get config() {
    return this._config;
  }

  get log() {
    return this._logger;
  }
}

module.exports = DetoxSecondaryContext;
