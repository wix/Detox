const log = require('npmlog');
const IosNoneDevice = require('./devices/IosNoneDevice');
const Simulator = require('./devices/Simulator');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;
const configuration = require('./configuration');
const Client = require('./client/Client');
const DetoxServer = require('detox-server');
const URL = require('url').URL;
const _ = require('lodash');

log.level = argparse.getArgValue('loglevel') || 'info';
log.addLevel('wss', 999, {fg: 'blue', bg: 'black'}, 'wss');
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
    if (!(this.userConfig.configurations && _.size(this.userConfig.configurations) >= 1)) {
      throw new Error(`no configured devices`);
    }

    this.detoxConfig.configurations = this.userConfig.configurations;

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
    await this.client.connect();
    await this.initConfiguration();
  }

  async cleanup() {
    if (this.client) {
      await this.client.cleanup();
    }
  }

  async initConfiguration() {
    const configurationName = argparse.getArgValue('configuration');

    let deviceConfig;
    if (!configurationName && _.size(this.detoxConfig.configurations) === 1) {
      deviceConfig = _.values(this.detoxConfig.configurations)[0];
    } else {
      deviceConfig = this.detoxConfig.configurations[configurationName];
    }

    if (!deviceConfig) {
      throw new Error(`Can not determine which configuration to use. use --configuration to choose one of the following: 
                      ${Object.keys(this.detoxConfig.configurations)}`);
    }

    switch (deviceConfig.type) {
      case "ios.simulator":
        await this.initIosSimulator(deviceConfig);
        break;
      case "ios.none":
        await this.initIosNoneDevice(deviceConfig);
        break;
      default:
        throw new Error('only simulator is supported currently');
    }
  }

  async setDevice(device, deviceConfig) {
    global.device = new device(this.client, this.detoxConfig.session, deviceConfig);
    await global.device.prepare();
  }

  async initIosExpectations() {
    this.expect = require('./ios/expect');
    this.expect.exportGlobals();
    this.expect.setInvocationManager(new InvocationManager(this.client));
  }

  async initIosSimulator(deviceConfig) {
    await this.initIosExpectations();
    await this.setDevice(Simulator, deviceConfig);
  }

  async initIosNoneDevice(deviceConfig) {
    await this.initIosExpectations();
    await this.setDevice(IosNoneDevice, deviceConfig);
  }
}

module.exports = Detox;
