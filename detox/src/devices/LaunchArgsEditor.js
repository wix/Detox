const _ = require('lodash');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

class LaunchArgsEditor {
  constructor(launchArgs) {
    if (!launchArgs) {
      throw new DetoxRuntimeError('Cannot instantiate a launch-arguments editor with no reference arguments-object!');
    }

    this._args = launchArgs;
  }

  modify(launchArgs) {
    for (const name of Object.keys(launchArgs)) {
      this._setLaunchArg(name, launchArgs[name]);
    }
  }

  reset() {
    for (const name of Object.keys(this._args)) {
      this._setLaunchArg(name, undefined);
    }
  }

  get() {
    return _.cloneDeep(this._args);
  }

  _setLaunchArg(name, value) {
    if (value === undefined || value === null) {
      delete this._args[name];
    } else {
      this._args[name] = value;
    }
  }
}

module.exports = LaunchArgsEditor;
