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
const ArtifactsPathsProvider = require('./artifacts/ArtifactsPathsProvider');
const appContext = require('./utils/appContext');

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
    this._currentTestNumber = 0;
    const artifactsLocation = argparse.getArgValue('artifacts-location');
    if(artifactsLocation !== undefined) {
      try {
        this._artifactsPathsProvider = new ArtifactsPathsProvider(artifactsLocation);
      } catch(ex) {
        log.warn(ex);
      }
    }
  }

  async init(params = {launchApp: true}) {
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
    const deviceDriver = new deviceClass(this.client);
    const binaryPath = await this._getBinaryPath(deviceConfig, deviceDriver);

    this.device = new Device(deviceConfig, sessionConfig, deviceDriver, binaryPath);
    await this.device.prepare(params);
    global.device = this.device;
  }

  async _getAppName(deviceDriver) {
    if (this.userConfig.appName) {
      return this.userConfig.appName;
    }

    log.info("appName was not found in config, we will set it for you");
    const platform = deviceDriver.getPlatform();
    try {
      const appName = await appContext.getAppName(platform);
      log.info(`Got the appName, its "${appName}". If this is wrong, please set the appName config property`);
      return appName;
    } catch (e) {
      throw new Error("You neither set the appName, nor could we find it anywhere. Please set it in your configuration.");
    }
  }

  async _getBinaryPath(deviceConfig, deviceDriver) {
    if (deviceConfig.binaryPath) {
      return deviceConfig.binaryPath;
    }

    const binaryPaths = this.userConfig.binary || {};
    const defaultBinaryPathOverwrite = binaryPaths[deviceDriver.getPlatform()];
    const appName = await this._getAppName(deviceDriver);
    return deviceDriver.getBinaryPath(appName, deviceConfig.release, defaultBinaryPathOverwrite);
  }

  async cleanup() {
    if (this.client) {
      await this.client.cleanup();
    }

    if (this.device) {
      await this.device._cleanup();
    }

    if (argparse.getArgValue('cleanup') && this.device) {
      await this.device.shutdown();
    }
  }

  async beforeEach(...testNameComponents) {
    this._currentTestNumber++;
    if (this._artifactsPathsProvider !== undefined) {
      const testArtifactsPath = this._artifactsPathsProvider.createPathForTest(this._currentTestNumber, ...testNameComponents)
      this.device.setArtifactsDestination(testArtifactsPath);
    }
  }

  async afterEach(suiteName, testName) {
    if(this._artifactsPathsProvider !== undefined) {
      await this.device.finalizeArtifacts();
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
