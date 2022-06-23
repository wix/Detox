const path = require('path');
const { URL } = require('url');
const util = require('util');

const fs = require('fs-extra');
const _ = require('lodash');

const DetoxContext = require('./DetoxContext');

class DetoxPrimaryContext extends DetoxContext {
  constructor() {
    super();

    this._wss = null;
    this._globalLifecycleHandler = null;
    /**
     * @type {import('./ipc/IPCServer') | null}
     * @private
     */
    this._ipcServer = null;

    // TODO: think about signal-exit and cleaning up the logs
  }

  get session() {
    return this._ipcServer
      ? this._ipcServer.sessionState
      : null;
  }

  /**
   * @override
   * @param {Partial<Detox.DetoxInitOptions>} [opts]
   */
  async _doInit(opts) {
    const configuration = require('./configuration');
    const config = this._config = await configuration.composeDetoxConfig({
      argv: opts.argv,
      testRunnerArgv: opts.testRunnerArgv,
    });

    const { behaviorConfig, deviceConfig, loggerConfig, sessionConfig } = config;
    await this._logger.setConfig(loggerConfig);

    this._logger.trace(
      { event: 'DETOX_CONFIG', config },
      'creating Detox server with config:\n%s',
      // @ts-ignore
      util.inspect(_.omit(config, ['errorComposer']), {
        getters: false,
        depth: Infinity,
        maxArrayLength: Infinity,
        maxStringLength: Infinity,
        breakLength: false,
        compact: false,
      })
    );

    const IPCServer = require('./ipc/IPCServer');
    this._ipcServer = new IPCServer({
      id: `primary-${process.pid}`,
      detoxConfig: this._config,
      logger: this._logger,
    });

    process.env.DETOX_IPC_SERVER_ID = this._ipcServer.id;
    process.env.DETOX_LOGLEVEL = this._logger.level;
    await this._ipcServer.init();

    const environmentFactory = require('./environmentFactory');
    this._globalLifecycleHandler = await environmentFactory.createGlobalLifecycleHandler(deviceConfig);

    if (this._globalLifecycleHandler) {
      await this._globalLifecycleHandler.globalInit();
    }

    if (!behaviorConfig.init.keepLockFile) {
      await this._resetLockFile();
    }

    const DetoxServer = require('./server/DetoxServer');
    this._wss = new DetoxServer({
      port: sessionConfig.server
        ? new URL(sessionConfig.server).port
        : 0,
      standalone: false,
    });

    await this._wss.open();

    if (!sessionConfig.server) {
      sessionConfig.server = `ws://localhost:${this._wss.port}`;
    }
  }

  async _doCleanup() {
    try {
      if (this._globalLifecycleHandler) {
        await this._globalLifecycleHandler.globalCleanup();
        this._globalLifecycleHandler = null;
      }

      if (this._wss) {
        await this._wss.close();
        this._wss = null;
      }

      const logFiles = [this._logger.config.file];
      if (this._ipcServer) {
        logFiles.push(...this._ipcServer.sessionState.logFiles);
        await this._ipcServer.dispose();
        this._ipcServer = null;
      }

      try {
        await this._finalizeLogs(logFiles.filter(f => f && fs.existsSync(f)));
      } catch (err) {
        this._logger.error({ err }, 'Encountered an error while merging the process logs:');
      }
    } finally {
      await super._doCleanup();
    }
  }

  async _finalizeLogs(logs) {
    const jsonl = require('./utils/jsonl');

    if (!logs || logs.length === 0) {
      return;
    }

    const { rootDir, plugins } = this._config && this._config.artifactsConfig || {};
    const logConfig = plugins && plugins.log || 'none';
    const enabled = rootDir && (typeof logConfig === 'string' ? logConfig !== 'none' : logConfig.enabled);

    try {
      if (enabled) {
        await fs.mkdirp(rootDir);

        return new Promise((resolve, reject) => {
          const resolveCache = [false, false];
          const resolveIndex = (index) => {
            resolveCache[index] = true;
            if (resolveCache[0] && resolveCache[1]) {
              resolve();
            }
          };

          const mergedStream = jsonl
            .mergeSorted(
              logs
                .map(filePath => fs.createReadStream(filePath))
                .map(fileStream => jsonl.toJSONLStream(fileStream))
            );

          const out1Stream = fs.createWriteStream(path.join(this._config.artifactsConfig.rootDir, 'detox.jsonl'));
          jsonl.toStringifiedStream(mergedStream)
            .on('error', err => out1Stream.emit('error', err))
            .pipe(out1Stream)
            .on('error', reject)
            .on('end', () => resolveIndex(0));

          const out2Stream = fs.createWriteStream(path.join(this._config.artifactsConfig.rootDir, 'detox-copy.jsonl'));
          jsonl.toStringifiedStream(mergedStream)
            .on('error', err => out2Stream.emit('error', err))
            .pipe(out2Stream)
            .on('error', reject)
            .on('end', () => resolveIndex(1));
        });
      }
    } finally {
      await Promise.all(logs.map(filepath => fs.remove(filepath)));
    }
  }

  async _resetLockFile() {
    const DeviceRegistry = require('./devices/DeviceRegistry');

    const deviceType = this._config.deviceConfig.type;

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
      const GenyDeviceRegistryFactory = require('./devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
      await GenyDeviceRegistryFactory.forGlobalShutdown().reset();
    }
  }
}

module.exports = DetoxPrimaryContext;
