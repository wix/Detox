const log = require('npmlog');
const Device = require('./devices/Device');
const IosDriver = require('./devices/IosDriver');
const SimulatorDriver = require('./devices/SimulatorDriver');
const EmulatorDriver = require('./devices/EmulatorDriver');
const argparse = require('./utils/argparse');
const configuration = require('./configuration');
const Client = require('./client/Client');
const DetoxServer = require('detox-server');
const URL = require('url').URL;
const _ = require('lodash');

log.level = argparse.getArgValue('loglevel') || 'info';
log.addLevel('wss', 999, {fg: 'blue', bg: 'black'}, 'wss');
log.heading = 'detox';

const DEVICE_CLASSES = {
  'ios.simulator': SimulatorDriver,
  'ios.none': IosDriver,
  'android.emulator': EmulatorDriver
};

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
      throw new Error(`No configured devices`);
    }

    const deviceConfig = await this._getDeviceConfig();
    if (!deviceConfig.type) {
      configuration.throwOnEmptyType();
    }

    const [sessionConfig, shouldStartServer] = await this._chooseSession(deviceConfig);

    if (shouldStartServer) {
      this.server = new DetoxServer(new URL(sessionConfig.server).port);
    }

    this.client = new Client(sessionConfig);
    await this.client.connect();

    const deviceClass = DEVICE_CLASSES[deviceConfig.type];
    if (!deviceClass) {
      throw new Error(`'${deviceConfig.type}' is not supported`);
    }
    await this._setDevice(sessionConfig, deviceClass, deviceConfig, this.client);
  }

  async _setDevice(sessionConfig, deviceClass, deviceConfig, client) {
    const deviceDriver = new deviceClass(client);
    this.device = new Device(deviceConfig, sessionConfig, deviceDriver);
    await this.device.prepare();
    global.device = this.device;
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
    let session = deviceConfig.session;
    let shouldStartServer = false;

    if (!session) {
      session = this.userConfig.session;
    }

    if (!session) {
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
}

module.exports = Detox;
