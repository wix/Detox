const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const configuration = require('../configuration');

class Device {
  constructor(client, params) {
    this.client = client;
    this.params = params;
    this._currentScheme = this._detrmineCurrentScheme(params);
  }

  async reloadReactNative() {
    await this.client.reloadReactNative();
  }

  async sendUserNotification(params) {
    await this.client.sendUserNotification(params);
  }

  _getDefaultSchemesList() {
    return ['ios-simulator.debug', 'ios-simulator.release', 'ios-simulator'];
  }

  _detrmineCurrentScheme(params) {
    const defaultSchemes = this._getDefaultSchemesList();

    let scheme;
    const schemeOverride = argparse.getArgValue('scheme');

    if (schemeOverride) {
      scheme = _.get(params, schemeOverride);
      if (!scheme) {
        throw new Error(`could not find scheme '${schemeOverride}', make sure it's configured in your detox config`);
      }
    }

    let i = 0;
    while (!scheme && i < defaultSchemes.length) {
      scheme = _.get(params, defaultSchemes[i]);
      i++;
    }

    configuration.validateScheme(scheme);
    return scheme;
  }

  _prepareLaunchArgs(additionalLaunchArgs) {
    const session = this.params.session;
    let args = ['-detoxServer', session.server, '-detoxSessionId', session.sessionId];
    if (additionalLaunchArgs) {
      args = args.concat(_.flatten(Object.entries(additionalLaunchArgs)));
    }
    return args;
  }
}

module.exports = Device;
