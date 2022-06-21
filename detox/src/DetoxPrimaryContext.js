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
        logFiles.push(...this._ipcServer.state.logFiles);
        await this._ipcServer.dispose();
        this._ipcServer = null;
      }

      this._finalizeLogs(logFiles.filter(f => f && fs.existsSync(f)));
    } finally {
      await super._doCleanup();
    }
  }

  _finalizeLogs(logs) {
    if (!logs || logs.length === 0) {
      return;
    }

    // TODO: reconcile the log artifacts
    const { rootDir, plugins } = this._config && this._config.artifactsConfig || {};
    const logConfig = plugins && plugins.log || 'none';
    const enabled = rootDir && (typeof logConfig === 'string' ? logConfig !== 'none' : logConfig.enabled);
    if (enabled) {
      fs.mkdirpSync(rootDir);

      for (const filepath of logs) {
        fs.renameSync(filepath, path.join(this._config.artifactsConfig.rootDir, path.basename(filepath)));
      }
    } else {
      for (const filepath of logs) {
        fs.unlinkSync(filepath);
      }
    }
  }

  get lastFailedTests() {
    // TODO: retrieve from IPC
    return [];
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
