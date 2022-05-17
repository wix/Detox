// @ts-nocheck
const { URL } = require('url');
const util = require('util');

const _ = require('lodash');

const configuration = require('../../src/configuration');
const DeviceRegistry = require('../../src/devices/DeviceRegistry');
const GenyDeviceRegistryFactory = require('../../src/devices/allocation/drivers/android/genycloud/GenyDeviceRegistryFactory');
const NullLogger = require('../../src/logger/NullLogger');
const DetoxServer = require('../../src/server/DetoxServer');

const BunyanLogger = require('./BunyanLogger');
const IPCServer = require('./IPCServer');

class DetoxRootContext {
  constructor() {
    this._config = null;
    this._wss = null;
    this._ipc = null;
    this._logger = new NullLogger();

    this.setup = this.setup.bind(this);
    this.teardown = this.teardown.bind(this);
  }

  async setup({ argv }) {
    this._config = await configuration.composeDetoxConfig({ argv });

    try {
      await this._doSetup();
    } catch (e) {
      await this.teardown();
      throw e;
    }
  }

  async teardown() {
    if (this._ipc) {
      await this._ipc.stop();
    }

    if (this._wss) {
      await this._wss.close();
      this._wss = null;
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
    this._logger = new BunyanLogger({
      loglevel: config.cliConfig.loglevel || 'info',
    });

    this.log.trace(
      { event: 'DETOX_CONFIG', config },
      'creating Detox server with config:\n%s',
      util.inspect(_.omit(config, ['errorComposer']), {
        getters: false,
        depth: Infinity,
        maxArrayLength: Infinity,
        maxStringLength: Infinity,
        breakLength: false,
        compact: false,
      })
    );

    this._ipc = new IPCServer({
      sessionId: `detox-${process.pid}`,
      detoxConfig: this._config,
      logger: this._logger,
    });

    await this._ipc.start();
    const { cliConfig, sessionConfig } = config;

    if (!cliConfig.keepLockFile) {
      await this._resetLockFile();
    }

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
      await GenyDeviceRegistryFactory.forGlobalShutdown().reset();
    }
  }
}

module.exports = DetoxRootContext;
