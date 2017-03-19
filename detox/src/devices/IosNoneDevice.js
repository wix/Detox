const fs = require('fs');
const path = require('path');
const Device = require('./Device');

class IosNoneDevice extends Device {

  constructor(client, session, deviceConfig) {
    super(client, session, deviceConfig);
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
}

module.exports = IosNoneDevice;
