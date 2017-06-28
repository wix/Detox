const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');

class Device {
  constructor(client, session, deviceConfig) {
    this.client = client;
    this._session = session;
    this._deviceConfig = deviceConfig;
    this.validate(deviceConfig);
  }

  validate(deviceConfig) {
    return true;
  }

  async prepare() {
    await this.client.waitUntilReady();
  }

  async relaunchApp() {
    return await Promise.resolve(444);
  }

  async installApp() {
    return await Promise.resolve('');
  }

  async uninstallApp() {
    return await Promise.resolve('');
  }

  async openURL() {
    return await Promise.resolve('');
  }
  
  async setLocation(lat, lon) {
    return await Promise.resolve('');
  }

  async reloadReactNative() {
    return await this.client.reloadReactNative();
  }

  async sendUserNotification(params) {
    await this.client.sendUserNotification(params);
  }

  async shutdown() {
    return await Promise.resolve('');
  }

  async setURLBlacklist(urlList) {
    return await Promise.resolve('');
  }

  async enableSynchronization() {
    return await Promise.resolve('');
  }

  async disableSynchronization() {
    return await Promise.resolve('');
  }

  _prepareLaunchArgs(additionalLaunchArgs) {
    let args = ['-detoxServer', this._session.server, '-detoxSessionId', this._session.sessionId];
    if (additionalLaunchArgs) {
      args = args.concat(_.flatten(Object.entries(additionalLaunchArgs)));
    }
    return args;
  }
}

module.exports = Device;
