const { URL } = require('url');
const util = require('util');

const _ = require('lodash');

const NullLogger = require('./logger/NullLogger');

class DetoxPrimaryContext {
  constructor() {
    this._config = null;
    this._wss = null;
    this._ipc = null;
    this._logger = new NullLogger();
    this._globalLifecycleHandler = null;
    /** @type {import('./DetoxWorker') | null} */
    this._worker = null;

    this.setup = this.setup.bind(this);
    this.teardown = this.teardown.bind(this);
  }

  /**
   * @param {object} [opts]
   * @param {object} [opts.argv]
   * @param {String} [opts.cwd]
   * @param {NodeJS.Global} [opts.global]
   * @param {object} [opts.testRunnerArgv]
   * @param {Boolean} [opts.noWorker]
   * @returns {Promise<import('./DetoxWorker') | null>}
   */
  async setup(opts = {}) {
    const configuration = require('./configuration');
    this._config = await configuration.composeDetoxConfig({
      argv: opts.argv,
      testRunnerArgv: opts.testRunnerArgv,
    });

    try {
      await this._doSetup();

      if (!opts.noWorker) {
          const worker = this._worker = this._allocateWorker(opts.global || global);
          await worker.setup();
      }

      return this._worker;
    } catch (e) {
      await this.teardown();
      throw e;
    }
  }

  /**
   * @returns {import('./DetoxWorker')}
   */
  _allocateWorker(opts) {
    const DetoxWorker = require('./DetoxWorker');
    DetoxWorker.global = opts.global || global;
    return new DetoxWorker();
  }

  async teardown() {
    if (this._worker) {
      await this._worker.teardown();
      this._worker = null;
    }

    if (this._ipc) {
      await this._ipc.stop();
      this._ipc = null;
    }

    if (this._wss) {
      await this._wss.close();
      this._wss = null;
    }

    if (this._globalLifecycleHandler) {
      await this._globalLifecycleHandler.globalCleanup();
      this._globalLifecycleHandler = null;
    }

    // TODO: move the artifacts
  }

  get config() {
    return this._config;
  }

  get log() {
    return this._logger;
  }

  get lastFailedTests() {
    // TODO: retrieve from IPC
    return [];
  }

  async _doSetup() {
    const config = this._config;

    const BunyanLogger = require('./logger/BunyanLogger');
    this._logger = new BunyanLogger({
      loglevel: config.cliConfig.loglevel || 'info',
    });

    this.log.trace(
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
    await this._ipc.start();

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
