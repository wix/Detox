const path = require('path');
const fs = require('fs');
const log = require('../../utils/logger').child({ __filename });
const DeviceDriverBase = require('./DeviceDriverBase');
const InvocationManager = require('../../invoke').InvocationManager;
const invoke = require('../../invoke');
const GREYConfigurationApi = require('../../ios/earlgreyapi/GREYConfiguration');
const GREYConfigurationDetox = require('../../ios/earlgreyapi/GREYConfigurationDetox');
const EarlyGreyImpl = require('../../ios/earlgreyapi/EarlGreyImpl');
const AppleSimUtils = require('../ios/AppleSimUtils');

const SimulatorLogPlugin = require('../../artifacts/log/ios/SimulatorLogPlugin');
const SimulatorScreenshotPlugin = require('../../artifacts/screenshot/SimulatorScreenshotPlugin');
const SimulatorRecordVideoPlugin = require('../../artifacts/video/SimulatorRecordVideoPlugin');
const SimulatorInstrumentsPlugin = require('../../artifacts/instruments/SimulatorInstrumentsPlugin');
const IosExpect = require('../../ios/expect');

class IosDriver extends DeviceDriverBase {
  constructor(config) {
    super(config);

    this.applesimutils = new AppleSimUtils();
    this.matchers = new IosExpect(new InvocationManager(this.client));
  }

  declareArtifactPlugins() {
    const appleSimUtils = this.applesimutils;
    const client = this.client;

    return {
      instruments: (api) => new SimulatorInstrumentsPlugin({ api, client }),
      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils }),
      video: (api) => new SimulatorRecordVideoPlugin({ api, appleSimUtils }),
    };
  }

  createPayloadFile(notification) {
    const notificationFilePath = path.join(this.createRandomDirectory(), `payload.json`);
    fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
    return notificationFilePath;
  }

  async setURLBlacklist(urlList) {
    await this.client.execute(
      GREYConfigurationApi.setValueForConfigKey(
        invoke.callDirectly(GREYConfigurationApi.sharedInstance()),
        urlList,
        "GREYConfigKeyURLBlacklistRegex"
      )
    );
  }

  async enableSynchronization() {
    await this.client.execute(
      GREYConfigurationDetox.enableSynchronization(
        invoke.callDirectly(GREYConfigurationApi.sharedInstance())
      )
    );
  }

  async disableSynchronization() {
    await this.client.execute(
      GREYConfigurationDetox.disableSynchronization(
        invoke.callDirectly(GREYConfigurationApi.sharedInstance())
      )
    );
  }

  async shake(deviceId) {
    return await this.client.shake();
  }

  async setOrientation(deviceId, orientation) {
    const call = EarlyGreyImpl.rotateDeviceToOrientationErrorOrNil(invoke.EarlGrey.instance,orientation);
    await this.client.execute(call);
  }

  validateDeviceConfig(config) {
    //no validation
  }

  getPlatform() {
    return 'ios';
  }

  async pressBack(deviceId) {
    log.warn('pressBack is an android specific function, make sure you create an android specific test for this scenario');
  }
}

module.exports = IosDriver;
