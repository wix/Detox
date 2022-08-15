const fs = require('fs');

const { DetoxInternalError } = require('../errors');
const { SecondarySessionState } = require('../ipc/state');
const symbols = require('../symbols');

const DetoxContext = require('./DetoxContext');

const { $logger, $restoreSessionState, $sessionState } = DetoxContext.protected;
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
  async [symbols.globalSetup]() {
    const IPCClient = require('../ipc/IPCClient');

    this[_ipcClient] = new IPCClient({
      id: `secondary-${process.pid}`,
      state: this[$sessionState],
      logger: this[$logger],
    });

    await this[_ipcClient].init();
  }

  /** @override */
  async [symbols.globalTeardown]() {
    if (this[_ipcClient]) {
      await this[_ipcClient].dispose();
      this[_ipcClient] = null;
    }
  }

  /** @override */
  async [symbols.setup](opts = {}) {
    if (!this[_ipcClient]) {
      this[_shortLifecycle] = true;
      await this[symbols.globalSetup]();
    }

    const workerId = opts.workerId || 1;
    await this[_ipcClient].registerWorker(workerId);
    await super[symbols.setup](opts);
  }

  /** @override */
  async [symbols.teardown]() {
    try {
      await super[symbols.teardown]();
    } finally {
      if (this[_shortLifecycle]) {
        await this[symbols.globalTeardown]();
      }
    }
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
