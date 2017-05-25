const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const invoke = require('../invoke');

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

  async reloadReactNative() {
    return await this.client.reloadReactNative();
  }

  async sendUserNotification(params) {
    await this.client.sendUserNotification(params);
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

    const call = invoke.EarlGrey.call(
      'rotateDeviceToOrientation:errorOrNil:',
      invoke.IOS.NSInteger(orientationMapping[orientation])
    );
    await new invoke.InvocationManager(this.client).execute(call);
  }

  async shutdown() {
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
