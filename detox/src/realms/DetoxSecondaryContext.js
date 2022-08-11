const fs = require('fs');

const { DetoxInternalError } = require('../errors');
const { SecondarySessionState } = require('../ipc/state');
const symbols = require('../symbols');

const DetoxContext = require('./DetoxContext');

const { $logger, $restoreSessionState, $sessionState } = DetoxContext.protected;
const _ipcClient = Symbol('ipcClient');

class DetoxSecondaryContext extends DetoxContext {
  constructor() {
    super();

    /**
     * @protected
     * @type {*}
     */
    this[_ipcClient] = null;
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
  async [symbols.globalSetup](_opts = {}) {
    // This is a no-op function.
    // It is forbidden to add any logic to `globalSetup` of the secondary context.
    // Violating this principle will almost definitely break some flows, where it is
    // not guaranteed that `globalSetup` will ever get called. See UML diagrams.
  }

  /** @override */
  async [symbols.globalTeardown]() {
    // This is a no-op function.
    // It is forbidden to add any logic to `globalTeardown` of the secondary context.
    // Violating this principle will almost definitely break some flows, where it is
    // not guaranteed that `globalTeardown` will ever get called. See UML diagrams.
  }

  /** @override */
  async [symbols.setup](opts) {
    const IPCClient = require('../ipc/IPCClient');

    this[_ipcClient] = new IPCClient({
      id: `secondary-${process.pid}`,
      state: this[$sessionState],
      logger: this[$logger],
    });

    const workerId = opts.workerId || 1;
    await this[_ipcClient].init();
    await this[_ipcClient].registerWorker(workerId);
    await super[symbols.setup](opts);
  }

  /** @override */
  async [symbols.teardown]() {
    try {
      await super[symbols.teardown]();
    } finally {
      if (this[_ipcClient]) {
        await this[_ipcClient].dispose();
        this[_ipcClient] = null;
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
