const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const configuration = require('../configuration');

class Device {
  constructor(client, session, deviceConfig) {
    this.client = client;
    this._session = session;
    this._deviceConfig = deviceConfig;
  }

  async reloadReactNative() {
    await this.client.reloadReactNative();
  }

  async sendUserNotification(params) {
    await this.client.sendUserNotification(params);
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
