const log = require('npmlog');
const path = require('path');
const fs = require('fs');
const DeviceDriverBase = require('./DeviceDriverBase');
const InvocationManager = require('../invoke').InvocationManager;
const invoke = require('../invoke');
const GREYConfiguration = require('./../ios/earlgreyapi/GREYConfiguration');
const exec = require('child-process-promise').exec;
const environment = require('../utils/environment');

class IosDriver extends DeviceDriverBase {

  constructor(client) {
    super(client);

    const expect = require('../ios/expect');
    expect.exportGlobals();
    expect.setInvocationManager(new InvocationManager(client));
  }

  createPushNotificationJson(notification) {
    const notificationFilePath = path.join(__dirname, `detox`, `notifications`, `notification.json`);
    this.ensureDirectoryExistence(notificationFilePath);
    fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
    return notificationFilePath;
  }

  //TODO:In order to support sharding, we need to create a device factory, and move prepare()
  // to that factory, to only have a single instance of it.
  async prepare() {
    const detoxIosSourceTarballDirPath = path.join(__dirname, '../..');
    const detoxFrameworkPath = await environment.getFrameworkPath();
    const detoxFrameworkDirPath = path.parse(detoxFrameworkPath).dir;


    if (fs.existsSync(detoxFrameworkDirPath)) {
      if(!fs.existsSync(`${detoxFrameworkPath}`)) {
        throw  new Error(`is it currently building ?`);
      }
    } else {
      log.info(`Building Detox.framework (${environment.getDetoxVersion()}) into ${detoxFrameworkDirPath}...`);
      await exec(path.join(__dirname, `../../scripts/build_framework.ios.sh "${detoxIosSourceTarballDirPath}" "${detoxFrameworkDirPath}"`));
    }
  }

  async sendUserNotification(notification) {
    const notificationFilePath = this.createPushNotificationJson(notification);
    await super.sendUserNotification({detoxUserNotificationDataURL: notificationFilePath});
  }

  async openURL(deviceId, params) {
    this.client.openURL(params);
  }

  async setURLBlacklist(urlList) {
    await this.client.execute(GREYConfiguration.setURLBlacklist(urlList));
  }

  async enableSynchronization() {
    await this.client.execute(GREYConfiguration.enableSynchronization());
  }

  async disableSynchronization() {
    await this.client.execute(GREYConfiguration.disableSynchronization());
  }

  async setOrientation(deviceId, orientation) {
    // keys are possible orientations
    const orientationMapping = {
      landscape: 3, // top at left side landscape
      portrait: 1  // non-reversed portrait
    };
    if (!Object.keys(orientationMapping).includes(orientation)) {
      throw new Error(`setOrientation failed: provided orientation ${orientation} is not part of supported orientations: ${Object.keys(orientationMapping)}`)
    }

    const call = invoke.call(invoke.EarlGrey.instance,
      'rotateDeviceToOrientation:errorOrNil:',
      invoke.IOS.NSInteger(orientationMapping[orientation])
    );
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
}

module.exports = IosDriver;
