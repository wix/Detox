const path = require('path');
const fs = require('fs');
const log = require('../utils/logger').child({ __filename });
const DeviceDriverBase = require('./DeviceDriverBase');
const InvocationManager = require('../invoke').InvocationManager;
const invoke = require('../invoke');
const GREYConfigurationApi = require('./../ios/earlgreyapi/GREYConfiguration');
const GREYConfigurationDetox = require('./../ios/earlgreyapi/GREYConfigurationDetox');
const EarlyGrey = require('./../ios/earlgreyapi/EarlGrey');

class IosDriver extends DeviceDriverBase {
  constructor(client) {
    super(client);

    this.expect = require('../ios/expect');
    this.expect.setInvocationManager(new InvocationManager(client));
  }

  exportGlobals() {
    this.expect.exportGlobals();
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
    const call = EarlyGrey.rotateDeviceToOrientationErrorOrNil(invoke.EarlGrey.instance,orientation);

    await this.client.execute(call);
  }

  defaultLaunchArgsPrefix() {
    return '-';
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
