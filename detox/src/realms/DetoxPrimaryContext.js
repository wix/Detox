const { URL } = require('url');

const fs = require('fs-extra');
const onSignalExit = require('signal-exit');

const temporary = require('../artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('../errors');
const SessionState = require('../ipc/SessionState');
const { getCurrentCommand } = require('../utils/argparse');
const retry = require('../utils/retry');
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
const _cookieAllocators = Symbol('cookieAllocators');
const _deviceAllocators = Symbol('deviceAllocators');
const _createDeviceAllocator = Symbol('createDeviceAllocator');
const _createDeviceAllocatorInstance = Symbol('createDeviceAllocatorInstance');
const _allocateDeviceOnce = Symbol('allocateDeviceOnce');
//#endregion

class DetoxPrimaryContext extends DetoxContext {
  constructor() {
    super();

    this[_dirty] = false;
    this[_wss] = null;
    this[_cookieAllocators] = {};
    this[_deviceAllocators] = {};

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

  [symbols.conductEarlyTeardown] = async (permanent = false) => {
    if (this[_ipcServer]) {
      await this[_ipcServer].onConductEarlyTeardown({ permanent });
    }
  };

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
      logger: loggerConfig,
      session: sessionConfig
    } = detoxConfig;
    await this[symbols.logger].setConfig(loggerConfig);

    this[_lifecycleLogger].trace.begin({
      cwd: process.cwd(),
      data: this[$sessionState],
    }, getCurrentCommand());

    const IPCServer = require('../ipc/IPCServer');
    this[_ipcServer] = new IPCServer({
      sessionState: this[$sessionState],
      logger: this[symbols.logger],
      callbacks: {
        onAllocateDevice: this[symbols.allocateDevice].bind(this),
        onDeallocateDevice: this[symbols.deallocateDevice].bind(this),
      },
    });

    await this[_ipcServer].init();

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

  /** @override */
  async [symbols.allocateDevice](deviceConfig) {
    const deviceAllocator = await this[_createDeviceAllocator](deviceConfig);

    const retryOptions = {
      backoff: 'none',
      retries: 5,
      interval: 25000,
      conditionFn: (e) => deviceAllocator.isRecoverableError(e),
    };

    return await retry(retryOptions, async () => {
      return await this[_allocateDeviceOnce](deviceAllocator, deviceConfig);
    });
  }

  async [_allocateDeviceOnce](deviceAllocator, deviceConfig) {
    const deviceCookie = await deviceAllocator.allocate(deviceConfig);
    this[_cookieAllocators][deviceCookie.id] = deviceAllocator;

    try {
      return await deviceAllocator.postAllocate(deviceCookie);
    } catch (e) {
      try {
        await deviceAllocator.free(deviceCookie, { shutdown: true });
      } catch (e2) {
        this[symbols.logger].error({
          cat: 'device',
          err: e2
        }, `Failed to free ${deviceCookie.name || deviceCookie.id} after a failed allocation attempt`);
      } finally {
        delete this[_cookieAllocators][deviceCookie.id];
      }

      throw e;
    }
  }

  /** @override */
  async [symbols.deallocateDevice](cookie) {
    const deviceAllocator = this[_cookieAllocators][cookie.id];
    if (!deviceAllocator) {
      throw new DetoxRuntimeError({
        message: `Cannot deallocate device ${cookie.id} because it was not allocated by this context.`,
        hint: `See the actually known allocated devices below:`,
        debugInfo: Object.keys(this[_cookieAllocators]).map(id => `- ${id}`).join('\n'),
      });
    }

    await deviceAllocator.free(cookie);
    delete this[_cookieAllocators][cookie.id];
  }

  /** @override */
  async [symbols.cleanup]() {
    try {
      if (this[$worker]) {
        await this[symbols.uninstallWorker]();
      }
    } finally {
      for (const key of Object.keys(this[_deviceAllocators])) {
        const deviceAllocator = this[_deviceAllocators][key];
        delete this[_deviceAllocators][key];
        try {
          await deviceAllocator.cleanup();
        } catch (err) {
          this[symbols.logger].error({ cat: 'device', err }, `Failed to cleanup the device allocation driver for ${key}`);
        }
      }

      this[_cookieAllocators] = {};

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

    for (const key of Object.keys(this[_deviceAllocators])) {
      const deviceAllocator = this[_deviceAllocators][key];
      delete this[_deviceAllocators][key];
      try {
        deviceAllocator.emergencyCleanup();
      } catch (err) {
        this[symbols.logger].error({ cat: 'device', err }, `Failed to clean up the device allocation driver for ${key} in emergency mode`);
      }
    }

    this[_cookieAllocators] = {};

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

  /** @param {Detox.DetoxDeviceConfig} deviceConfig */
  [_createDeviceAllocator] = async (deviceConfig) => {
    const deviceType = deviceConfig.type;
    const deviceAllocator = this[_createDeviceAllocatorInstance](deviceConfig);

    try {
      await deviceAllocator.init();
    } catch (e) {
      try {
        delete this[_deviceAllocators][deviceType];
        await deviceAllocator.cleanup();
      } catch (e2) {
        this[symbols.logger].error({ cat: 'device', err: e2 }, `Failed to cleanup the device allocation driver for ${deviceType} after a failed initialization`);
      }

      throw e;
    }

    return this[_deviceAllocators][deviceType];
  };

  /**
   * @param {Detox.DetoxDeviceConfig} deviceConfig
   * @returns { DeviceAllocator }
   */
  [_createDeviceAllocatorInstance] = (deviceConfig) => {
    const deviceType = deviceConfig.type;

    if (!this[_deviceAllocators][deviceType]) {
      const environmentFactory = require('../environmentFactory');
      const { deviceAllocatorFactory } = environmentFactory.createFactories(deviceConfig);
      const { detoxConfig } = this[$sessionState];

      this[_deviceAllocators][deviceType] = deviceAllocatorFactory.createDeviceAllocator({
        detoxConfig,
        detoxSession: this[$sessionState]
      });
    }
    return this[_deviceAllocators][deviceType];
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
