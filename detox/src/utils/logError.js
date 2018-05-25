const log = require('npmlog');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

function logError(err, prefix = 'detox') {
  if (!err) {
    log.error(prefix, 'Unknown error (null)');
    return;
  }

  // HACK: because `instanceof` approach does not work in logError.test.js
  if (err.constructor.name === DetoxRuntimeError.name) {
    log.error(prefix, '%s', err.stack);

    if (err.hint) {
      log.warn(prefix, 'Hint: %s', err.hint);
    }

    if (err.debugInfo) {
      log.warn(prefix, 'See debug info below:\n%s', err.debugInfo);
    }

    return;
  }

  if (err.childProcess) {
    log.error(prefix, '%s', err.message);
    log.verbose('child-process-stdout', '%s', err.stdout);
    log.verbose('child-process-stderr', '%s', err.stderr);

    return;
  }

  log.error(prefix, '', err);
}

module.exports = logError;
