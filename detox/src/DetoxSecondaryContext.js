const fs = require('fs');

const DetoxContext = require('./DetoxContext');
const { DetoxInternalError } = require('./errors');
const { SecondarySessionState } = require('./ipc/state');
const symbols = require('./symbols');

class DetoxSecondaryContext extends DetoxContext {
  constructor() {
    super();
    /**
     * @protected
     * @type {*}
     */
    this._ipcClient = null;
  }

  /**
   * @protected
   * @override
   * @return {SecondarySessionState}
   */
  _restoreSessionState() {
    return SecondarySessionState.parse(fs.readFileSync(process.env.DETOX_CONFIG_SNAPSHOT_PATH));
  }

  [symbols.reportFailedTests] = async (testFilePaths) => {
    if (this._ipcClient) {
      await this._ipcClient.reportFailedTests(testFilePaths);
    } else {
      throw new DetoxInternalError('Detected an attempt to report failed tests using a non-initialized context.');
    }
  };

  async _doInit(opts) {
    const IPCClient = require('./ipc/IPCClient');

    if (!this._ipcClient) {
      this._ipcClient = new IPCClient({
        id: opts.workerId != null ? `worker-${opts.workerId}` : `secondary-${process.pid}`,
        serverId: this._sessionState.detoxIPCServer,
        logger: this._logger,
        workerId: opts.workerId,
      });

      await this._ipcClient.init();
    }
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
