const utils = require('../utils/argparse');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const websocket = require('../websocket');
const argparse = require('../utils/argparse');
const DetoxConfigError = require('../errors/errors').DetoxConfigError;

class Device {
  constructor() {

  }

  prepare() {

  }

  async relaunchApp() {

  }

  async deleteAndRelaunchApp() {

  }

  async reloadReactNativeApp() {

  }

  async openURL() {

  }

  _detrmineCurrentScheme(params) {

    let scheme;
    const schemeOverride = argparse.getArgValue('scheme');
    if (schemeOverride) {
      scheme = _.get(params, schemeOverride);
    }
    if (!scheme) {
      scheme = _.get(params, 'ios-simulator.debug');
    }
    if (!scheme) {
      scheme = _.get(params, 'ios-simulator.release');
    }
    if (!scheme) {
      scheme = _.get(params, 'ios-simulator');
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

module.exports = Device;
