const path = require('path');
const { URL } = require('url');
const { promisify } = require('util');

const fs = require('fs-extra');
const glob = require('glob');
const pipe = require('multipipe');
const onSignalExit = require('signal-exit');

const temporary = require('../artifacts/utils/temporaryPath');
const { DetoxRuntimeError } = require('../errors');
const SessionState = require('../ipc/SessionState');
const symbols = require('../symbols');

const globAsync = promisify(glob);
const globSync = glob.sync;

const DetoxContext = require('./DetoxContext');

const { $restoreSessionState, $sessionState, $worker } = DetoxContext.protected;

const _finalizeLogs = Symbol('finalizeLogs');
const _finalizeLogsSync = Symbol('finalizeLogsSync');
const _globalLifecycleHandler = Symbol('globalLifecycleHandler');
const _ipcServer = Symbol('ipcServer');
const _resetLockFile = Symbol('resetLockFile');
const _wss = Symbol('wss');
const _dirty = Symbol('dirty');
const _emergencyTeardown = Symbol('emergencyTeardown');
const _areLogsEnabled = Symbol('areLogsEnabled');
const _lifecycleLogger = Symbol('lifecycleLogger');

class DetoxPrimaryContext extends DetoxContext {
  constructor() {
    super();

    this[_dirty] = false;
    this[_wss] = null;
    this[_globalLifecycleHandler] = null;
    /**
     * @type {import('../ipc/IPCServer') | null}
     */
    this[_ipcServer] = null;
    /** @type {Detox.Logger} */
    this[_lifecycleLogger] = this[symbols.logger].child({ cat: 'lifecycle' });
  }

  //#region Internal members
  async [symbols.reportFailedTests](testFilePaths, permanent = false) {
    if (this[_ipcServer]) {
      this[_ipcServer].onFailedTests({ testFilePaths, permanent });
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
      data: this[$sessionState],
    }, process.argv.slice(1).join(' '));

    const IPCServer = require('../ipc/IPCServer');
    this[_ipcServer] = new IPCServer({
      sessionState: this[$sessionState],
      logger: this[symbols.logger],
    });

    await this[_ipcServer].init();

    const environmentFactory = require('../environmentFactory');
    this[_globalLifecycleHandler] = await environmentFactory.createGlobalLifecycleHandler(deviceConfig);

    if (this[_globalLifecycleHandler]) {
      await this[_globalLifecycleHandler].globalInit();
    }

    if (!behaviorConfig.init.keepLockFile) {
      await this[_resetLockFile]();
    }

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

    await fs.writeFile(this[$sessionState].detoxConfigSnapshotPath, this[$sessionState].stringify());
    process.env.DETOX_CONFIG_SNAPSHOT_PATH = this[$sessionState].detoxConfigSnapshotPath;

    if (opts.workerId !== null) {
      await this[symbols.installWorker](opts);
    }
  }

  /**
   * @override
   * @param {Partial<DetoxInternals.DetoxInstallWorkerOptions>} [opts]
   */
  async [symbols.installWorker](opts = {}) {
    const workerId = this[$sessionState].workerId = opts.workerId = opts.workerId || 'worker';
    this[_ipcServer].onRegisterWorker({ workerId });

    await super[symbols.installWorker](opts);
  }

  /** @override */
  async [symbols.cleanup]() {
    try {
      if (this[$worker]) {
        await this[symbols.uninstallWorker]();
      }
    } finally {
      if (this[_globalLifecycleHandler]) {
        await this[_globalLifecycleHandler].globalCleanup();
        this[_globalLifecycleHandler] = null;
      }

      if (this[_wss]) {
        await this[_wss].close();
        this[_wss] = null;
      }

      if (this[_ipcServer]) {
        await this[_ipcServer].dispose();
        this[_ipcServer] = null;
      }

      await fs.remove(this[$sessionState].detoxConfigSnapshotPath);

      if (this[_dirty]) {
        try {
          this[_lifecycleLogger].trace.end();
          await this[_finalizeLogs]();
        } catch (err) {
          this[_lifecycleLogger].error({ err }, 'Encountered an error while merging the process logs:');
        }
      }
    }
  }

  [_emergencyTeardown] = (_code, signal) => {
    if (!signal) {
      return;
    }

    if (this[_globalLifecycleHandler]) {
      this[_globalLifecycleHandler].emergencyCleanup();
      this[_globalLifecycleHandler] = null;
    }

    if (this[_wss]) {
      this[_wss].close();
    }

    if (this[_ipcServer]) {
      this[_ipcServer].dispose();
    }

    try {
      this[_lifecycleLogger].trace.end({ abortSignal: signal });
      this[_finalizeLogsSync]();
    } catch (err) {
      this[symbols.logger].error({ err }, 'Encountered an error while merging the process logs:');
    }
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
      detoxConfigSnapshotPath: temporary.for.json(),
      detoxIPCServer: `primary-${process.pid}`,
    });
  }
  //#endregion

  //#region Private members
  async[_finalizeLogs]() {
    const sessionId = this[$sessionState].id;
    const logs = await globAsync(temporary.for.jsonl(`${sessionId}.*`));
    if (logs.length === 0) {
      return;
    }

    if (this[_areLogsEnabled]()) {
      const streamUtils = require('../logger/utils/streamUtils');
      const { rootDir } = this[symbols.config].artifacts;

      await fs.mkdirp(rootDir);
      const [out1Stream, out2Stream, out3Stream] = ['detox.log.jsonl', 'detox.log', 'detox.trace.json']
        .map((filename) => fs.createWriteStream(path.join(rootDir, filename)));

      const mergedStream = streamUtils.uniteSessionLogs(sessionId);

      await Promise.all([
        pipe(mergedStream, streamUtils.writeJSONL(), out1Stream),
        pipe(mergedStream, streamUtils.debugStream(this[symbols.logger].config.options), out2Stream),
        pipe(mergedStream, streamUtils.chromeTraceStream(), streamUtils.writeJSON(), out3Stream),
      ]);
    }

    await Promise.all(logs.map(filepath => fs.remove(filepath)));
  }

  async[_finalizeLogsSync]() {
    const logsEnabled = this[_areLogsEnabled]();

    const { rootDir } = this[symbols.config].artifacts;

    if (logsEnabled) {
      fs.mkdirpSync(rootDir);
    }

    const sessionId = this[$sessionState].id;
    const logs = globSync(temporary.for.jsonl(`${sessionId}.*`));

    for (const log of logs) {
      if (logsEnabled) {
        fs.moveSync(log, path.join(rootDir, path.basename(log)));
      } else {
        fs.removeSync(log);
      }
    }
  }

  [_areLogsEnabled]() {
    const { rootDir, plugins } = this[symbols.config].artifacts || {};
    if (!rootDir || !plugins) {
      return false;
    }

    if (!plugins.log.enabled) {
      return false;
    }

    if (!plugins.log.keepOnlyFailedTestsArtifacts) {
      return true;
    }

    const { failedTestFiles, testFilesToRetry } = this[$sessionState];
    return failedTestFiles.length + testFilesToRetry.length > 0;
  }

  async[_resetLockFile]() {
    const DeviceRegistry = require('../devices/DeviceRegistry');

    const deviceType = this[symbols.config].device.type;

    switch (deviceType) {
      case 'ios.none':
      case 'ios.simulator':
        await DeviceRegistry.forIOS().reset();
        break;
      case 'android.attached':
      case 'android.emulator':
      case 'android.genycloud':
        await DeviceRegistry.forAndroid().reset();
        break;
    }

    if (deviceType === 'android.genycloud') {
      const GenyDeviceRegistryFactory = require('../devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
      await GenyDeviceRegistryFactory.forGlobalShutdown().reset();
    }
  }
  //#endregion
}

module.exports = DetoxPrimaryContext;
