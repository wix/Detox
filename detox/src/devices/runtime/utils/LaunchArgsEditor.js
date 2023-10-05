const _ = require('lodash');

const ScopedLaunchArgsEditor = require('./ScopedLaunchArgsEditor');

class LaunchArgsEditor {
  constructor() {
    this._local = new ScopedLaunchArgsEditor();
    this._shared = new ScopedLaunchArgsEditor();
  }

  get shared() {
    return this._shared;
  }

  modify(launchArgs) {
    this._local.modify(launchArgs);
    return this;
  }

  reset() {
    this._local.reset();
    return this;
  }

  get() {
    return _.merge(this._shared.get(), this._local.get());
  }
}

module.exports = LaunchArgsEditor;
