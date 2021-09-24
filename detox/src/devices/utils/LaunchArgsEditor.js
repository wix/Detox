const _ = require('lodash');

const Storage = require('./Storage');

/**
 * @typedef {Object} LaunchArgsEditorOptions
 * @property {boolean} [permanent=false] - Indicates whether the operation should affect the permanent app launch args.
 */

class LaunchArgsEditor {
  constructor() {
    this._permanent = new Storage();
    this._transient = new Storage();
  }

  /** @param {LaunchArgsEditorOptions} [options] */
  modify(launchArgs, options) {
    if (!_.isEmpty(launchArgs)) {
      if (options && options.permanent) {
        this._permanent.assign(launchArgs);
      } else {
        this._transient.assign(launchArgs);
      }
    }

    return this;
  }

  /** @param {LaunchArgsEditorOptions} [options] */
  reset(options) {
    this._transient.reset();

    if (options && options.permanent) {
      this._permanent.reset();
    }

    return this;
  }

  /** @param {LaunchArgsEditorOptions} [options] */
  get(options) {
    const permanent = options && options.permanent;

    if (permanent === true) {
      return this._permanent.get();
    }

    if (permanent === false) {
      return this._transient.get();
    }

    return _.merge(this._permanent.get(), this._transient.get());
  }
}

module.exports = LaunchArgsEditor;
