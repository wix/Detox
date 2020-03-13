const _ = require('lodash');

class DetoxRuntimeError extends Error {
  constructor({ message = '', hint = '', debugInfo = '' } = {}) {
    const formattedMessage = _.compact([
      message,
      hint && `HINT: ${hint}`,
      debugInfo
    ]).join('\n\n');

    super(formattedMessage);
    this.name = 'DetoxRuntimeError';
  }
}

module.exports = DetoxRuntimeError;
