const DetoxContext = require('./DetoxContext');

class DetoxSecondaryContext extends DetoxContext {
  constructor() {
    super();

    /**
     * @protected
     * @type {*}
     */
    this._ipcClient = null;
  }

  async _doInit(opts) {
    const IPCClient = require('./ipc/IPCClient');
    this._ipcClient = new IPCClient({
      id: opts.workerId != null ? `worker-${opts.workerId}` : `secondary-${process.pid}`,
      logger: this._logger,
      serverId: process.env.DETOX_IPC_SERVER_ID,
      workerId: opts.workerId,
    });

    await this._ipcClient.init();

    this._config = this._ipcClient.sessionState.detoxConfig;
    await this._logger.setConfig(this._config.loggerConfig);
  }

  /**
   * @protected
   */
  async _doCleanup() {
    if (this._ipcClient) {
      await this._ipcClient.dispose();
      this._ipcClient = null;
    }
  }
}

module.exports = DetoxSecondaryContext;
