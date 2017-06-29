const fs = require('fs');
const path = require('path');
const Device = require('./Device');
const InvocationManager = require('../invoke').InvocationManager;
const GREYConfiguration = require('./../ios/earlgreyapi/GREYConfiguration');

class IosNoneDevice extends Device {

  constructor(client, session, deviceConfig) {
    super(client, session, deviceConfig);

    const expect = require('../ios/expect');
    expect.exportGlobals();
    expect.setInvocationManager(new InvocationManager(client));
  }

  ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }

    this.ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
    return true;
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
}

module.exports = IosNoneDevice;
