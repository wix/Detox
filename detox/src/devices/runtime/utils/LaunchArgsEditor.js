const _ = require('lodash');

const log = require('../../../utils/logger');

const ScopedLaunchArgsEditor = require('./ScopedLaunchArgsEditor');

/**
 * @typedef {Object} LaunchArgsEditorOptions
 * @property {boolean} [permanent=false] - Indicates whether the operation should affect the permanent app launch args.
 */

class LaunchArgsEditor {
  constructor() {
    this._local = new ScopedLaunchArgsEditor();
    this._shared = new ScopedLaunchArgsEditor();
  }

  get shared() {
    return this._shared;
  }

  /**
   * @param {LaunchArgsEditorOptions} [options] - deprecated
   */
  modify(launchArgs, options) {
    this._assertNoDeprecatedOptions('modify', options);

    if (!_.isEmpty(launchArgs)) {
      if (options && options.permanent) {
        this._shared.modify(launchArgs);
      } else {
        this._local.modify(launchArgs);
      }
    }

    return this;
  }

  /**
   * @param {LaunchArgsEditorOptions} [options] - deprecated
   */
  reset(options) {
    this._assertNoDeprecatedOptions('reset', options);
    this._local.reset();

    if (options && options.permanent) {
      this._shared.reset();
    }

    return this;
  }

  /**
   * @param {LaunchArgsEditorOptions} [options] - deprecated
   */
  get(options) {
    this._assertNoDeprecatedOptions('get', options);
    const permanent = options && options.permanent;

    if (permanent === true) {
      return this._shared.get();
    }

    if (permanent === false) {
      return this._local.get();
    }

    return _.merge(this._shared.get(), this._local.get());
  }

  _assertNoDeprecatedOptions(methodName, options) {
    if (!options) {
      return;
    }

    const target = options.permanent ? 'appLaunchArgs.shared' : 'appLaunchArgs';
    log.warn({ event: 'DEPRECATION' }, [
      `Detected an attempt to use device.launchArgs.${methodName}(...) with a deprecated 'options' parameter.`,
      `Please use device.${target}.${methodName}(...) instead.`,
      `For more details, see the reference at: https://wix.github.io/Detox/docs/api/device-object-api#deviceapplaunchargs\n`,
    ].join('\n'));
  }
}

module.exports = LaunchArgsEditor;
