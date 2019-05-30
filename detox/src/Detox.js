const _ = require('lodash');
const util = require('util');
const logger = require('./utils/logger');
const log = require('./utils/logger').child({ __filename });
const Device = require('./devices/Device');
const IosDriver = require('./devices/drivers/IosDriver');
const SimulatorDriver = require('./devices/drivers/SimulatorDriver');
const EmulatorDriver = require('./devices/drivers/EmulatorDriver');
const AttachedAndroidDriver = require('./devices/drivers/AttachedAndroidDriver');
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
    this._deviceConfig = deviceConfig;
    this._userSession = deviceConfig.session || session;
    this._client = null;
    this._server = null;
    this._artifactsManager = new ArtifactsManager();

    this.device = null;
  }

  async init(userParams) {
    const sessionConfig = await this._getSessionConfig();
    const params = {
      launchApp: true,
      initGlobals: true,
      ...userParams,
    };

    if (!this._userSession) {
      this._server = new DetoxServer({
        log: logger,
        port: new URL(sessionConfig.server).port,
      });
    }

    this._client = new Client(sessionConfig);
    await this._client.connect();

    const DeviceDriverClass = DEVICE_CLASSES[this._deviceConfig.type];
    if (!DeviceDriverClass) {
      throw new Error(`'${this._deviceConfig.type}' is not supported`);
    }

    const deviceDriver = new DeviceDriverClass({
      client: this._client,
    });

    this._artifactsManager.subscribeToDeviceEvents(deviceDriver);
    this._artifactsManager.registerArtifactPlugins(deviceDriver.declareArtifactPlugins());

    const device = new Device({
      deviceConfig: this._deviceConfig,
      deviceDriver,
      sessionConfig,
    });

    await device.prepare(params);

    const globalsToExport = {
      ...deviceDriver.matchers,
      device,
    };

    Object.assign(this, globalsToExport);
    if (params.initGlobals) {
      Object.assign(global, globalsToExport);
    }

    await this._artifactsManager.onBeforeAll();

    return this;
  }

  async cleanup() {
    await this._artifactsManager.onAfterAll();

    if (this._client) {
      await this._client.cleanup();
    }

    if (this.device) {
      await this.device._cleanup();
    }

    if (this._server) {
      await this._server.close();
    }

    if (argparse.getArgValue('cleanup') && this.device) {
      await this.device.shutdown();
    }
  }

  async beforeEach(testSummary) {
    this._validateTestSummary(testSummary);
    this._logTestRunCheckpoint('DETOX_BEFORE_EACH', testSummary);
    await this._handleAppCrashIfAny(testSummary.fullName);
    await this._artifactsManager.onBeforeEach(testSummary);
  }

  async afterEach(testSummary) {
    this._validateTestSummary(testSummary);
    this._logTestRunCheckpoint('DETOX_AFTER_EACH', testSummary);
    await this._artifactsManager.onAfterEach(testSummary);
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
        debugInfo: `testSummary was: ${util.inspect(testSummary)}`,
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
    const pendingAppCrash = this._client.getPendingCrashAndReset();

    if (pendingAppCrash) {
      log.error({ event: 'APP_CRASH' }, `App crashed in test '${testName}', here's the native stack trace: \n${pendingAppCrash}`);
      await this.device.launchApp({ newInstance: true });
    }
  }

  async _getSessionConfig() {
    const session = this._userSession || await configuration.defaultSession();

    configuration.validateSession(session);

    return session;
  }
}

module.exports = Detox;
