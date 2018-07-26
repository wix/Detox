const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

function logError(baseLogger, err) {
  const log = baseLogger.child({ error: true });

  if (!err) {
    log.error('Unknown error (null)');
    return;
  }

  if (err.childProcess) {
    return;
  }

  // HACK: because `instanceof` approach does not work in logError.test.js
  if (err.constructor.name === DetoxRuntimeError.name) {
    log.error({ stack: true }, err.stack);

    if (err.hint) {
      log.warn({ hint: true }, 'Hint: ' + err.hint);
    }

    if (err.debugInfo) {
      log.warn({ debugInfo: true }, 'See debug info below:\n' + err.debugInfo);
    }

    return;
  }


  log.error({ err }, err);
}

module.exports = logError;
