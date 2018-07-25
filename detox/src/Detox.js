const _ = require('lodash');
const logger = require('./utils/logger');
const log = require('./utils/logger').child({ __filename });
const Device = require('./devices/Device');
const IosDriver = require('./devices/IosDriver');
const SimulatorDriver = require('./devices/SimulatorDriver');
const EmulatorDriver = require('./devices/EmulatorDriver');
const AttachedAndroidDriver = require('./devices/AttachedAndroidDriver');
const DetoxRuntimeError = require('./errors/DetoxRuntimeError');
const argparse = require('./utils/argparse');
const configuration = require('./configuration');
const Client = require('./client/Client');
const DetoxServer = require('./server/DetoxServer');
const URL = require('url').URL;
const ArtifactsManager = require('./artifacts/ArtifactsManager');

const DEVICE_CLASSES = {
  'ios.simulator': SimulatorDriver,
  'ios.none': IosDriver,
  'android.emulator': EmulatorDriver,
  'android.attached': AttachedAndroidDriver,
};

class Detox {
  constructor({deviceConfig, session}) {
    this.deviceConfig = deviceConfig;
    this.userSession = deviceConfig.session || session;
    this.client = null;
    this.device = null;
    this.artifactsManager = new ArtifactsManager();
  }

  async init(userParams) {
    const sessionConfig = await this._getSessionConfig();
    const params = {
      launchApp: true,
      initGlobals: true,
      ...userParams,
    };

    if (!this.userSession) {
      this.server = new DetoxServer({
        log: logger,
        port: new URL(sessionConfig.server).port,
      });
    }

    this.client = new Client(sessionConfig);
    await this.client.connect();

    const deviceClass = DEVICE_CLASSES[this.deviceConfig.type];

    if (!deviceClass) {
      throw new Error(`'${this.deviceConfig.type}' is not supported`);
    }

    const deviceDriver = new deviceClass(this.client);
    this.artifactsManager.registerArtifactPlugins(deviceDriver.declareArtifactPlugins());
    this.device = new Device(this.deviceConfig, sessionConfig, deviceDriver);
    this.artifactsManager.subscribeToDeviceEvents(this.device);

    await this.device.prepare(params);

    if (params.initGlobals) {
      deviceDriver.exportGlobals();
      global.device = this.device;
    }

    await this.artifactsManager.onBeforeAll();
  }

  async cleanup() {
    await this.artifactsManager.onAfterAll();

    if (this.client) {
      await this.client.cleanup();
    }

    if (this.device) {
      this.artifactsManager.unsubscribeFromDeviceEvents(this.device);
      await this.device._cleanup();
    }

    if (this.server) {
      this.server.close();
    }

    if (argparse.getArgValue('cleanup') && this.device) {
      await this.device.shutdown();
    }
  }

  async terminate() {
    await this.artifactsManager.onTerminate();
    await this.cleanup();
  }

  async beforeEach(testSummary) {
    this._validateTestSummary(testSummary);
    this._logTestRunCheckpoint('DETOX_BEFORE_EACH', testSummary);
    await this._handleAppCrashIfAny(testSummary.fullName);
    await this.artifactsManager.onBeforeEach(testSummary);
  }

  async afterEach(testSummary) {
    this._validateTestSummary(testSummary);
    this._logTestRunCheckpoint('DETOX_AFTER_EACH', testSummary);
    await this.artifactsManager.onAfterEach(testSummary);
    await this._handleAppCrashIfAny(testSummary.fullName);
  }

  _logTestRunCheckpoint(event, { status, fullName }) {
    log.trace({ event, status }, `${status} test: ${JSON.stringify(fullName)}`);
  }

  _validateTestSummary(testSummary) {
    if (!_.isPlainObject(testSummary)) {
      throw new DetoxRuntimeError({
        message: `Invalid test summary was passed to detox.beforeEach(testSummary)` +
          '\nExpected to get an object of type: { title: string; fullName: string; status: "running" | "passed" | "failed"; }',
        hint: 'Maybe you are still using an old undocumented signature detox.beforeEach(string, string, string) in init.js ?' +
          '\nSee the article for the guidance: ' +
          'https://github.com/wix/detox/blob/master/docs/APIRef.TestLifecycle.md',
        debugInfo: `testSummary was: ${JSON.stringify(testSummary, null, 2)}`,
      });
    }

    switch (testSummary.status) {
      case 'running':
      case 'passed':
      case 'failed':
        break;
      default:
        throw new DetoxRuntimeError({
          message: `Invalid test summary status was passed to detox.beforeEach(testSummary). Valid values are: "running", "passed", "failed"`,
          hint: "It seems like you've hit a Detox integration issue with a test runner. You are encouraged to report it in Detox issues on GitHub.",
          debugInfo: `testSummary was: ${JSON.stringify(testSummary, null, 2)}`,
        });
    }
  }

  async _handleAppCrashIfAny(testName) {
    const pendingAppCrash = this.client.getPendingCrashAndReset();

    if (pendingAppCrash) {
      log.error({ event: 'APP_CRASH' }, `App crashed in test '${testName}', here's the native stack trace: \n${pendingAppCrash}`);
      await this.device.launchApp({ newInstance: true });
    }
  }

  async _getSessionConfig() {
    const session = this.userSession || await configuration.defaultSession();

    configuration.validateSession(session);

    return session;
  }
}

module.exports = Detox;
