const chalk = require('chalk');
const log = require('../../src/utils/logger').child({ __filename });

function coerceDeprecation(option) {
  return function coerceDeprecationFn(value) {
    log.warn(`Beware: ${option} will be removed in the next version of Detox.`);

    return value;
  };
}

module.exports = {
  coerceDeprecation,
};
