const Storage = require('./Storage');

class ScopedLaunchArgsEditor {
  constructor() {
    this._storage = new Storage();
  }

  get() {
    return this._storage.get();
  }

  reset() {
    this._storage.reset();
    return this;
  }

  modify(launchArgs) {
    this._storage.assign(launchArgs);
    return this;
  }
}

module.exports = ScopedLaunchArgsEditor;
