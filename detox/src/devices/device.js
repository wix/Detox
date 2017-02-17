const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const configuration = require('../configuration');

class Device {
  constructor(websocket, params) {
    this._websocket = websocket;
    this.params = params;
    this._currentScheme = this._detrmineCurrentScheme(params);
  }

  prepareLaunchArgs(additionalLaunchArgs) {
    const session = this.params.session;
    let args = ['-detoxServer', session.server, '-detoxSessionId', session.sessionId];
    if (additionalLaunchArgs) {
      args = args.concat(_.flatten(Object.entries(additionalLaunchArgs)));
    }
    return  args;
  }

  reloadReactNativeApp(onLoad) {
    this._websocket.waitForAction('ready', onLoad);
    this._websocket.sendAction('reactNativeReload');
  }

  async sendUserNotification(done, params) {
    this._websocket.waitForAction('userNotificationDone', done);
    this._websocket.sendAction('userNotification', params);
  }

  async _waitUntilReady(onReady) {
    this._websocket.waitForAction('ready', onReady);
    this._websocket.sendAction('isReady');
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
}

module.exports = Device;
