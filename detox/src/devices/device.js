const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const CustomError = require('../errors/errors').CustomError;

class Device {
  constructor(websocket, params) {
    this._websocket = websocket;

    const session = params.session;
    this._defaultLaunchArgs = ['-detoxServer', session.server, '-detoxSessionId', session.sessionId];
    this._currentScheme = this._detrmineCurrentScheme(params);
  }

  reloadReactNativeApp(onLoad) {
    this._websocket.waitForAction('ready', onLoad);
    this._websocket.sendAction('reactNativeReload');
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

    this._validateScheme(scheme);
    return scheme;
  }

  _validateScheme(scheme) {
    if (!scheme) {
      throw new DetoxConfigError(`No scheme was found, in order to test a device pass settings under detox property, e.g.   
           "detox": {
            ...
            "ios-simulator": {
                "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
                "device": "iPhone 7 Plus"
            }
          }`);
    }

    if (!scheme.device) {
      throw new DetoxConfigError(`scheme.device property is missing, should hold the device type to test on`);
    }
    if (!scheme.app) {
      throw new DetoxConfigError(`scheme.app property is missing, should hold the app binary path`);
    }
  }
}

class DetoxConfigError extends CustomError {

}

module.exports = Device;
