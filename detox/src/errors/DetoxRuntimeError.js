const _ = require('lodash');
const util = require('util');

class DetoxRuntimeError extends Error {
  constructor(options) {
    super(formatOptions(options));
    this.name = 'DetoxRuntimeError';

    if (options && options.noStack) {
      delete this.stack;
    }
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
    if (err instanceof DetoxRuntimeError) {
      return err.message;
    }

    if (_.isError(err) && /^Command failed:/.test(err.message)) {
      return err.message;
    }

    if (_.isError(err) && (err.stack || err.message)) {
      return String(err.stack || err);
    }

    return this.inspectObj(err, inspectOptions)
  }
}

function formatOptions(options) {
  if (_.isObject(options)) {
    const {
      message = '',
      hint = '',
      debugInfo = '',
      inspectOptions = null,
    } = options;

    return _.compact([
      message,
      hint && `HINT: ${hint}`,
      _.isString(debugInfo)
        ? debugInfo
        : DetoxRuntimeError.format(debugInfo, inspectOptions),
    ]).join('\n\n');
  }

  return options;
}

module.exports = DetoxRuntimeError;
