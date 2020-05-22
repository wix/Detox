const _ = require('lodash');
const util = require('util');

class DetoxRuntimeError extends Error {
  constructor({
    message = '',
    hint = '',
    debugInfo = '',
    inspectOptions,
  } = {}) {
    const formattedMessage = _.compact([
      message,
      hint && `HINT: ${hint}`,
      _.isObject(debugInfo) ? inspectObj(debugInfo, inspectOptions) : debugInfo,
    ]).join('\n\n');

    super(formattedMessage);
    this.name = 'DetoxRuntimeError';
  }
}

function inspectObj(obj, options) {
  return util.inspect(obj, {
    colors: false,
    compact: false,
    depth: 0,
    showHidden: false,

    ...options,
  });
}

module.exports = DetoxRuntimeError;
