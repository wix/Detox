const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const DeviceDriverBase = require('./DeviceDriverBase');
const InvocationManager = require('../invoke').InvocationManager;
const invoke = require('../invoke');
const GREYConfiguration = require('./../ios/earlgreyapi/GREYConfiguration');
const argparse = require('../utils/argparse');


class IosDriver extends DeviceDriverBase {

  constructor(client) {
    super(client);

    const expect = require('../ios/expect');
    expect.exportGlobals();
    expect.setInvocationManager(new InvocationManager(client));
  }
  
  async getBundleIdFromBinary(appPath) {
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" ${path.join(appPath, 'Info.plist')}`);
      return _.trim(result.stdout);
    } catch (ex) {
      throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${appPath}`);
    }
  }

  createPushNotificationJson(notification) {
    const notificationFilePath = path.join(__dirname, `detox`, `notifications`, `notification.json`);
    this.ensureDirectoryExistence(notificationFilePath);
    fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
    return notificationFilePath;
  }

  async sendUserNotification(notification) {
    const notificationFilePath = this.createPushNotificationJson(notification);
    await super.sendUserNotification({detoxUserNotificationDataURL: notificationFilePath});
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

  async setOrientation(orientation) {
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
}

module.exports = IosDriver;
