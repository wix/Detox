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

    this.userConfig = userConfig;
    this.client = null;
    this.device = null;
  }

  async init() {
    if (!(this.userConfig.configurations && _.size(this.userConfig.configurations) >= 1)) {
      throw new Error(`no configured devices`);
    }

    const deviceConfig = await this._getDeviceConfig();
    const [session, shouldStartServer] = await this._chooseSession(deviceConfig);
    const deviceClass = await this._chooseDeviceClass(deviceConfig);

    if(shouldStartServer) {
      this.server = new DetoxServer(new URL(session.server).port);
    }

    const client = new Client(session);
    await client.connect();
    await this._initIosExpectations(client);
    await this._setDevice(session, deviceClass, deviceConfig, client);

    this.client = client
  }

  async cleanup() {
    if (this.client) {
      await this.client.cleanup();
    }

    if (argparse.getArgValue('cleanup')) {
      await this.device.shutdown();
    }
  }

  async _chooseSession(deviceConfig) {
    var session = deviceConfig.session;
    var shouldStartServer = false;

    if(!session) {
      session = this.userConfig.session;
    }

    if(!session) {
      session = await configuration.defaultSession();
      shouldStartServer = true;
    }

    configuration.validateSession(session);

    return [session, shouldStartServer];
  }

  async _getDeviceConfig() {
    const configurationName = argparse.getArgValue('configuration');
    const configurations = this.userConfig.configurations;

    let deviceConfig;
    if (!configurationName && _.size(configurations) === 1) {
      deviceConfig = _.values(configurations)[0];
    } else {
      deviceConfig = configurations[configurationName];
    }

    if (!deviceConfig) {
      throw new Error(`Cannot determine which configuration to use. use --configuration to choose one of the following: 
                      ${Object.keys(configurations)}`);
    }

    return deviceConfig;
  }

  async _chooseDeviceClass(deviceConfig)
  {
    switch (deviceConfig.type) {
      case "ios.simulator":
        return Simulator;
      case "ios.none":
        return IosNoneDevice;
      default:
        throw new Error('only simulator is supported currently');
    }
  }

  async _setDevice(session, deviceClass, deviceConfig, client) {
    this.device = new deviceClass(client, session, deviceConfig);
    await this.device.prepare();
    global.device = this.device;
  }

  async _initIosExpectations(client) {
    this.expect = require('./ios/expect');
    this.expect.exportGlobals();
    this.expect.setInvocationManager(new InvocationManager(client));
  }
}

module.exports = Detox;
