const _ = require('lodash');

class LaunchArgs {
  constructor(launchArgs = {}) {
    this._args = launchArgs;
  }

  modify(launchArgs) {
    Object
      .keys(launchArgs)
      .forEach((name) =>
        this._setLaunchArg(name, launchArgs[name]));
  }

  reset() {
    this._args = {};
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

module.exports = LaunchArgs;
