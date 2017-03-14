const log = require('npmlog');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;
const configuration = require('./configuration');
const Client = require('./client/client');
const DetoxServer = require('detox-server');
const URL = require('url').URL;
const _ = require('lodash');

log.level = argparse.getArgValue('loglevel') || 'info';
log.addLevel('wss', 999, {fg: 'blue', bg: 'black'}, 'verb');
log.heading = 'detox';

class Detox {

  constructor(userConfig) {
    if (!userConfig) {
      throw new Error(`No configuration was passed to detox, make sure you pass a config when calling 'detox.init(config)'`);
    }

    this.client = null;
    this.userConfig = userConfig;
    this.detoxConfig = {};
  }

  async config() {
    if (!(this.userConfig.devices && _.size(this.userConfig.devices) >= 1)) {
      throw new Error(`no configured devices`);
    }

    this.detoxConfig.devices = this.userConfig.devices;

    if (this.userConfig.session) {
      configuration.validateSession(this.userConfig.session);
      this.detoxConfig.session = this.userConfig.session;
    } else {
      this.detoxConfig.session = await configuration.defaultSession();
      const server = new DetoxServer(new URL(this.detoxConfig.session.server).port);
    }
    return this.detoxConfig;
  }

  async init() {
    await this.config();
    this.client = new Client(this.detoxConfig.session);
    const _connect = this.client.connect();
    const _initDevice = this.initDevice();

    await Promise.all([_initDevice]);
  }

  async cleanup() {
    if (this.client) {
      await this.client.cleanup();
    }
  }

  async initDevice() {
    const deviceName = argparse.getArgValue('device');
    let deviceConfig;

    if (!deviceName && _.size(this.detoxConfig.devices) === 1) {
      deviceConfig = _.values(this.detoxConfig.devices)[0];
    } else {
      deviceConfig = this.detoxConfig.devices[deviceName];
    }

    configuration.validateDevice(deviceConfig);

    switch (deviceConfig.type) {
      case "simulator":
        await this.initIosSimulator(deviceConfig);
        break;
      default:
        throw new Error('only simulator is supported currently');
    }
  }

  async setDevice(device, deviceConfig) {
    global.device = new device(this.client, this.detoxConfig.session, deviceConfig);
    await global.device.prepare();
  }

  async initIosSimulator(deviceConfig) {
    configuration.validateDevice(deviceConfig);
    this.expect = require('./ios/expect');
    this.expect.exportGlobals();
    this.expect.setInvocationManager(new InvocationManager(this.client));
    await this.setDevice(Simulator, deviceConfig);
  }
}

module.exports = Detox;
