const log = require('npmlog');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

function subscribe(process) {
  process.on('uncaughtException', function (err) {
    log.error('detox', 'Uncaught exception.');
    logDetoxRuntimeError(err);
    process.exit(1); // eslint-disable-line
  });

  process.on('unhandledRejection', function (reason) {
    log.error('detox', 'Unhandled rejection.');
    logDetoxRuntimeError(reason);
    process.exit(1); // eslint-disable-line
  });
}

function logDetoxRuntimeError(err) {
  if (err instanceof DetoxRuntimeError) {
    log.error('DetoxRuntimeError', '%s', err.stack);

    if (err.hint) {
      log.info('DetoxRuntimeError', 'Hint: %s', err.hint);
    }
    if (err.debugInfo) {
      log.warn('DetoxRuntimeError', 'See debug info below:\n%s', err.debugInfo);
    }
  } else {
    throw err;
  }
}

module.exports = subscribe;
