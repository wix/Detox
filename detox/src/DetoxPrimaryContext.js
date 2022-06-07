const { URL } = require('url');
const util = require('util');

const _ = require('lodash');

const DetoxSecondaryContext = require('./DetoxSecondaryContext');
const BunyanLogger = require('./logger/BunyanLogger');

class DetoxPrimaryContext extends DetoxSecondaryContext {
  constructor() {
    super();

    // eslint-disable-next-line unicorn/no-this-assignment
    const context = this;

    this._logger = new BunyanLogger({
      bunyanInstance: null,
      queue: [],
      get level() {
        return context._config ? context._config.cliConfig.loglevel : 'info';
      },
    });

    this._wss = null;
    this._globalLifecycleHandler = null;
  }

  /**
   * @override
   * @param {Detox.DetoxInitOptions} [opts]
   */
  async _doSetup(opts) {
    const configuration = require('./configuration');
    const config = this._config = await configuration.composeDetoxConfig({
      argv: opts.argv,
      testRunnerArgv: opts.testRunnerArgv,
    });

    this._logger.init();
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
    this._ipc = new IPCServer({
      id: 'detox-' + process.pid,
      detoxConfig: this._config,
      logger: this._logger,
    });

    process.env.DETOX_IPC_SERVER_ID = this._ipc.id;
    await this._ipc.setup();

    const { cliConfig, deviceConfig, sessionConfig } = config;

    const environmentFactory = require('./environmentFactory');
    this._globalLifecycleHandler = await environmentFactory.createGlobalLifecycleHandler(deviceConfig);

    if (this._globalLifecycleHandler) {
      await this._globalLifecycleHandler.globalInit();
    }

    if (!cliConfig.keepLockFile) {
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

  async _doTeardown() {
    if (this._globalLifecycleHandler) {
      await this._globalLifecycleHandler.globalCleanup();
      this._globalLifecycleHandler = null;
    }

    if (this._wss) {
      await this._wss.close();
      this._wss = null;
    }

    await super._doTeardown();

    await this._logger.dispose();
    // TODO: move the artifacts
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
