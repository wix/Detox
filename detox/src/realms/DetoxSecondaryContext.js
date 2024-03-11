const fs = require('fs-extra');

const { DetoxInternalError } = require('../errors');
const SessionState = require('../ipc/SessionState');

const DetoxContext = require('./DetoxContext');
const symbols = require('./symbols');

// Protected symbols
const { $restoreSessionState, $sessionState, $worker } = DetoxContext.protected;

//#region Private symbols
const _ipcClient = Symbol('ipcClient');
//#endregion

class DetoxSecondaryContext extends DetoxContext {
  constructor() {
    super();

    /**
     * @private
     * @type {import('../ipc/IPCClient')}
     */
    this[_ipcClient] = null;
  }

  //#region Internal members
  async [symbols.reportTestResults](testResults) {
    if (this[_ipcClient]) {
      await this[_ipcClient].reportTestResults(testResults);
    } else {
      throw new DetoxInternalError('Detected an attempt to report failed tests using a non-initialized context.');
    }
  }

  [symbols.conductEarlyTeardown] = async (permanent = false) => {
    if (this[_ipcClient]) {
      await this[_ipcClient].conductEarlyTeardown({ permanent });
    } else {
      throw new DetoxInternalError('Detected an attempt to report early teardown using a non-initialized context.');
    }
  };

  async [symbols.resolveConfig]() {
    return this[symbols.config];
  }

  /** @override */
  async [symbols.init](opts = {}) {
    const IPCClient = require('../ipc/IPCClient');

    this[_ipcClient] = new IPCClient({
      id: `secondary-${process.pid}`,
      sessionState: this[$sessionState],
      logger: this[symbols.logger],
    });

    await this[_ipcClient].init();

    if (opts.workerId !== null) {
      await this[symbols.installWorker](opts);
    }
  }

  /** @override */
  async [symbols.allocateDevice](deviceConfig) {
    if (this[_ipcClient]) {
      const deviceCookie = await this[_ipcClient].allocateDevice(deviceConfig);
      return deviceCookie;
    } else {
      throw new DetoxInternalError('Detected an attempt to allocate a device using a non-initialized context.');
    }
  }

  /** @override */
  async [symbols.deallocateDevice](deviceCookie) {
    if (this[_ipcClient]) {
      await this[_ipcClient].deallocateDevice(deviceCookie);
    } else {
      throw new DetoxInternalError('Detected an attempt to allocate a device using a non-initialized context.');
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
    const workerId = opts.workerId || 'worker';
    await this[_ipcClient].registerWorker(workerId);
    await super[symbols.installWorker]({ ...opts, workerId });
  }
  //#endregion

  //#region Protected members
  /**
   * @protected
   * @override
   * @return {SessionState}
   */
  [$restoreSessionState]() {
    return SessionState.parse(fs.readFileSync(process.env.DETOX_CONFIG_SNAPSHOT_PATH));
  }
  //#endregion
}

module.exports = DetoxSecondaryContext;
