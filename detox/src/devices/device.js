const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const configuration = require('../configuration');

class Device {
  constructor(websocket, params) {
    this._websocket = websocket;

    const session = params.session;
    this._defaultLaunchArgs = ['-detoxServer', session.server, '-detoxSessionId', session.sessionId]; //, '-detoxUserNotificationDataURL', uri];
    this._currentScheme = this._detrmineCurrentScheme(params);
  }

  reloadReactNativeApp(onLoad) {
    this._websocket.waitForAction('ready', onLoad);
    this._websocket.sendAction('reactNativeReload');
  }

  sendUserNotification(done, params) {
    this._websocket.waitForAction('userNotificationDone', done);
    this._websocket.sendAction('userNotification', params);
  }

  _waitUntilReady(onReady) {
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
        throw new DetoxConfigError(`could not find scheme '${schemeOverride}', make sure it's configured in your detox config`);
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
