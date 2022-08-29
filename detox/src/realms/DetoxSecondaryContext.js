const fs = require('fs');

const { DetoxInternalError } = require('../errors');
const { SecondarySessionState } = require('../ipc/state');
const symbols = require('../symbols');

const DetoxContext = require('./DetoxContext');

const { $restoreSessionState, $sessionState, $worker } = DetoxContext.protected;
const _ipcClient = Symbol('ipcClient');
const _shortLifecycle = Symbol('shortLifecycle');

class DetoxSecondaryContext extends DetoxContext {
  constructor() {
    super();

    /**
     * @private
     * @type {import('../ipc/IPCClient')}
     */
    this[_ipcClient] = null;
    /**
     * @private
     * @type {undefined | boolean}
     *
     * TODO: explain what is short lifecycle and why we need it
     */
    this[_shortLifecycle] = false;
  }

  //#region Internal members
  async [symbols.reportFailedTests](testFilePaths, permanent = false) {
    if (this[_ipcClient]) {
      await this[_ipcClient].reportFailedTests(testFilePaths, permanent);
    } else {
      throw new DetoxInternalError('Detected an attempt to report failed tests using a non-initialized context.');
    }
  }

  async [symbols.resolveConfig]() {
    return this[symbols.config];
  }

  /** @override */
  async [symbols.init](opts = {}) {
    this.log.overrideConsole();

    const IPCClient = require('../ipc/IPCClient');

    this[_ipcClient] = new IPCClient({
      id: `secondary-${process.pid}`,
      state: this[$sessionState],
      logger: this[symbols.logger],
    });

    await this[_ipcClient].init();

    if (opts.workerId !== null) {
      await this[symbols.installWorker](opts);
    }
  }

  /** @override */
  async [symbols.cleanup]() {
    try {
      if (this[$worker]) {
        await this[symbols.uninstallWorker]();
      }
    } finally {
      if (this[_ipcClient]) {
        await this[_ipcClient].dispose();
        this[_ipcClient] = null;
      }
    }
  }

  /** @override */
  async [symbols.installWorker](opts = {}) {
    const workerId = opts.workerId = opts.workerId || 'worker';
    await this[_ipcClient].registerWorker(workerId);
    await super[symbols.installWorker](opts);
  }
  //#endregion

  //#region Protected members
  /**
   * @protected
   * @override
   * @return {SecondarySessionState}
   */
  [$restoreSessionState]() {
    return SecondarySessionState.parse(fs.readFileSync(process.env.DETOX_CONFIG_SNAPSHOT_PATH));
  }
  //#endregion
}

module.exports = DetoxSecondaryContext;
