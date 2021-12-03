const _ = require('lodash');

const DetoxError = require('./DetoxError');

/**
 * @typedef DetoxRuntimeErrorOptions
 * @property message { String }
 * @property [hint] { String }
 * @property [debugInfo] { String }
 * @property [noStack] { Boolean }
 * @property [inspectOptions] { Object }
 */

class DetoxRuntimeError extends DetoxError {
  /**
   * @param options { DetoxRuntimeErrorOptions }
   */
  constructor(options) {
    super(formatOptions(options));
    this.name = 'DetoxRuntimeError';

    if (options && options.noStack) {
      delete this.stack;
    }
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
        : DetoxError.format(debugInfo, inspectOptions),
    ]).join('\n\n');
  }

  return options;
}

module.exports = DetoxRuntimeError;
