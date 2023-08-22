const { URL } = require('url');

const fs = require('fs-extra');
const onSignalExit = require('signal-exit');

const temporary = require('../artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('../errors');
const SessionState = require('../ipc/SessionState');
const { getCurrentCommand } = require('../utils/argparse');
const uuid = require('../utils/uuid');

const DetoxContext = require('./DetoxContext');
const symbols = require('./symbols');

// Protected symbols
const { $logFinalizer, $restoreSessionState, $sessionState, $worker } = DetoxContext.protected;

//#region Private symbols
const _ipcServer = Symbol('ipcServer');
const _wss = Symbol('wss');
const _dirty = Symbol('dirty');
const _emergencyTeardown = Symbol('emergencyTeardown');
const _lifecycleLogger = Symbol('lifecycleLogger');
const _sessionFile = Symbol('sessionFile');
const _logFinalError = Symbol('logFinalError');
const _deviceAllocator = Symbol('deviceAllocator');
//#endregion

class DetoxPrimaryContext extends DetoxContext {
  constructor() {
    super();

    this[_dirty] = false;
    this[_wss] = null;
    this[_deviceAllocator] = null;

    /** Path to file where the initial session object is serialized */
    this[_sessionFile] = '';
    /**
     * @type {import('../ipc/IPCServer') | null}
     */
    this[_ipcServer] = null;
    /** @type {Detox.Logger} */
    this[_lifecycleLogger] = this[symbols.logger].child({ cat: 'lifecycle' });
  }

  //#region Internal members
  async [symbols.reportTestResults](testResults) {
    if (this[_ipcServer]) {
      this[_ipcServer].onReportTestResults({ testResults });
    }
  }

  async [symbols.resolveConfig](opts = {}) {
    const session = this[$sessionState];
    if (!session.detoxConfig) {
      const configuration = require('../configuration');
      session.detoxConfig = await configuration.composeDetoxConfig(opts);
    }

    return session.detoxConfig;
  }

  /**
   * @override
   * @param {Partial<DetoxInternals.DetoxInitOptions>} [opts]
   */
  async [symbols.init](opts = {}) {
    if (this[_dirty]) {
      throw new DetoxRuntimeError({
        message: 'Cannot initialize primary Detox context more than once.',
        hint: DetoxRuntimeError.reportIssueIfJest,
      });
    }

    this[_dirty] = true;
    onSignalExit(this[_emergencyTeardown]);

    const detoxConfig = await this[symbols.resolveConfig](opts);

    const {
      behavior: behaviorConfig,
      device: deviceConfig,
      logger: loggerConfig,
      session: sessionConfig
    } = detoxConfig;
    await this[symbols.logger].setConfig(loggerConfig);

    this[_lifecycleLogger].trace.begin({
      cwd: process.cwd(),
      data: this[$sessionState],
    }, getCurrentCommand());

    // TODO: IPC Server creation ought to be delegated to a generator/factory.
    const IPCServer = require('../ipc/IPCServer');
    this[_ipcServer] = new IPCServer({
      sessionState: this[$sessionState],
      logger: this[symbols.logger],
    });

    await this[_ipcServer].init();

    const environmentFactory = require('../environmentFactory');

    const { deviceAllocatorFactory } = environmentFactory.createFactories(deviceConfig);
    this[_deviceAllocator] = deviceAllocatorFactory.createDeviceAllocator({});
    if (typeof this[_deviceAllocator].init === 'function') {
      await this[_deviceAllocator].init();
    }

    // TODO: Detox-server creation ought to be delegated to a generator/factory.
    const DetoxServer = require('../server/DetoxServer');
    if (sessionConfig.autoStart) {
      this[_wss] = new DetoxServer({
        port: sessionConfig.server
          ? new URL(sessionConfig.server).port
          : 0,
        standalone: false,
      });

      await this[_wss].open();
    }

    // TODO: double check that this config is indeed propogated onto the client create at the detox-worker side
    if (!sessionConfig.server && this[_wss]) {
      // @ts-ignore
      sessionConfig.server = `ws://localhost:${this[_wss].port}`;
    }

    this[_sessionFile] = temporary.for.json(this[$sessionState].id);
    await fs.writeFile(this[_sessionFile], this[$sessionState].stringify());
    process.env.DETOX_CONFIG_SNAPSHOT_PATH = this[_sessionFile];
    this[_lifecycleLogger].trace(`Serialized the session state at: ${this[_sessionFile]}`);

    if (opts.workerId !== null) {
      await this[symbols.installWorker](opts);
    }
  }

  /**
   * @override
   * @param {Partial<DetoxInternals.DetoxInstallWorkerOptions>} [opts]
   */
  async [symbols.installWorker](opts = {}) {
    const workerId = opts.workerId || 'worker';

    this[$sessionState].workerId = workerId;
    this[_ipcServer].onRegisterWorker({ workerId });

    await super[symbols.installWorker]({ ...opts, workerId });
  }

  async [symbols.allocateDevice]() {
    // TODO:
    // const deviceCookie = await this._deviceAllocator.allocateDevice();
    // await this._deviceAllocator.postAllocate(this._deviceCookie);
  }

  async [symbols.deallocateDevice]() {
    // TODO:
    // const shutdown = this._behaviorConfig ? this._behaviorConfig.cleanup.shutdownDevice : false;
    // await this._deviceAllocator.free(this._deviceCookie, { shutdown });
  }

  /** @override */
  async [symbols.cleanup]() {
    try {
      if (this[$worker]) {
        await this[symbols.uninstallWorker]();
      }
    } finally {
      if (this[_deviceAllocator]) {
        if (typeof this[_deviceAllocator].cleanup === 'function') {
          await this[_deviceAllocator].cleanup();
        }

        this[_deviceAllocator] = null;
      }

      if (this[_wss]) {
        await this[_wss].close();
        this[_wss] = null;
      }

      if (this[_ipcServer]) {
        await this[_ipcServer].dispose();
        this[_ipcServer] = null;
      }

      if (this[_sessionFile]) {
        await fs.remove(this[_sessionFile]);
      }

      if (this[_dirty]) {
        try {
          this[_lifecycleLogger].trace.end();
          await this[symbols.logger].close();
          await this[$logFinalizer].finalize();
        } catch (err) {
          this[_logFinalError](err);
        }
      }
    }
  }

  [_emergencyTeardown] = (_code, signal) => {
    if (!signal) {
      return;
    }

    if (this[_deviceAllocator]) {
      if (typeof this[_deviceAllocator].emergencyCleanup === 'function') {
        this[_deviceAllocator].emergencyCleanup();
      }
      this[_deviceAllocator] = null;
    }

    if (this[_wss]) {
      this[_wss].close();
    }

    if (this[_ipcServer]) {
      this[_ipcServer].dispose();
    }

    if (this[_sessionFile]) {
      fs.removeSync(this[_sessionFile]);
    }

    try {
      this[_lifecycleLogger].trace.end({ abortSignal: signal });
      this[symbols.logger].close().catch(this[_logFinalError]);
      this[$logFinalizer].finalizeSync();
    } catch (err) {
      this[_logFinalError](err);
    }
  };

  [_logFinalError] = (err) => {
    this[_lifecycleLogger].error(err, 'Encountered an error while merging the process logs:');
  };

  //#endregion

  //#region Protected members
  /**
   * @protected
   * @override
   * @return {SessionState}
   */
  [$restoreSessionState]() {
    return new SessionState({
      id: uuid.UUID(),
      detoxIPCServer: `primary-${process.pid}`,
    });
  }
  //#endregion
}

module.exports = DetoxPrimaryContext;
