const _ = require('lodash');
const DetoxError = require('./DetoxError');

class DetoxRuntimeError extends DetoxError {
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
