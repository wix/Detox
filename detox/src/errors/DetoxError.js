const util = require('util');

const _ = require('lodash');

class DetoxError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DetoxError';
  }

  static get reportIssue() {
    return 'Please report this issue on our GitHub tracker:\nhttps://github.com/wix/Detox/issues';
  }

  static inspectObj(obj, options) {
    return util.inspect(obj, {
      colors: false,
      compact: false,
      depth: 0,
      showHidden: false,

      ...options,
    });
  }

  /**
   * @param {*} err
   */
  static format(err, inspectOptions = { depth: 1 }) {
    if (err instanceof DetoxError) {
      return err.message;
    }

    if (_.isError(err) && /^Command failed:/.test(err.message)) {
      return err.message;
    }

    if (_.isError(err) && (err.stack || err.message)) {
      return String(err.stack || err);
    }

    return this.inspectObj(err, inspectOptions);
  }
}

module.exports = DetoxError;
