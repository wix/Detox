const log = require('../../src/utils/logger').child({ __filename });
const migrationGuideUrl = 'https://wix.to/I0DOAK0';

function coerceDeprecation(option) {
  return function coerceDeprecationFn(value) {
    log.warn(`Beware: ${option} will be removed in the next version of Detox.`);
    log.warn(`See the migration guide: ${migrationGuideUrl}`);

    return value;
  };
}

module.exports = {
  coerceDeprecation,
  migrationGuideUrl,
};
