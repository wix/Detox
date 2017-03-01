const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const Device = require('./device');
const FBsimctl = require('./Fbsimctl');

class Simulator extends Device {

  constructor(client, params) {
    super(client, params);
    this._fbsimctl = new FBsimctl();
    this._simulatorUdid = "";
    this.sim = "";
  }

  async _getBundleIdFromApp(appPath) {
    const absPath = this._getAppAbsolutePath(appPath);
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" ${path.join(absPath, 'Info.plist')}`);
      return _.trim(result.stdout);
    } catch (ex) {
      throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`);
    }
  }

  _getAppAbsolutePath(appPath) {
    const absPath = path.join(process.cwd(), appPath);
    if (fs.existsSync(absPath)) {
      return absPath;
    } else {
      throw new Error(`app binary not found at ${absPath}, did you build it?`);
    }
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

  async prepare() {
    this._simulatorUdid = await this._fbsimctl.list(this._currentScheme.device);
    this._bundleId = await this._getBundleIdFromApp(this._currentScheme.app);
    await this._fbsimctl.boot(this._simulatorUdid);
    await this.relaunchApp({delete: true});
  }

  async relaunchApp(params = {}) {
    if (params.url && params.userNotification) {
      throw new Error(`detox can't understand this 'relaunchApp(${JSON.stringify(params)})' request, either request to launch with url or with userNotification, not both`);
    }

    if (params.delete) {
      await this._fbsimctl.uninstall(this._simulatorUdid, this._bundleId);
      await this._fbsimctl.install(this._simulatorUdid, this._getAppAbsolutePath(this._currentScheme.app));
    } else {
      // Calling `relaunch` is not good as it seems `fbsimctl` does not forward env variables in this mode.
      await this._fbsimctl.terminate(this._simulatorUdid, this._bundleId);
    }

    let additionalLaunchArgs;
    if (params.url) {
      additionalLaunchArgs = {'-detoxURLOverride': params.url};
    } else if (params.userNotification) {
      additionalLaunchArgs = {'-detoxUserNotificationDataURL': this.createPushNotificationJson(params.userNotification)};
    }

    await this._fbsimctl.launch(this._simulatorUdid, this._bundleId, this._prepareLaunchArgs(additionalLaunchArgs));
    await this.client.waitUntilReady();
  }

  async installApp() {
    await this._fbsimctl.install(this._simulatorUdid, this._getAppAbsolutePath(this._currentScheme.app));
  }

  async uninstallApp() {
    await this._fbsimctl.uninstall(this._simulatorUdid, this._bundleId);
  }

  async openURL(url) {
    await this._fbsimctl.open(this._simulatorUdid, url);
  }
}

module.exports = Simulator;
