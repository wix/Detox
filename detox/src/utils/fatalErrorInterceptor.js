const npmlog = require('npmlog');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

function subscribe(process) {
  process.on('uncaughtException', function (err) {
    npmlog.error('detox', 'Uncaught exception.');
    logDetoxRuntimeError(err);
    process.exit(1);
  });

  process.on('unhandledRejection', function (reason) {
    npmlog.error('detox', 'Unhandled rejection.');
    logDetoxRuntimeError(reason);
    process.exit(1);
  });
}

function logDetoxRuntimeError(err) {
  if (err instanceof DetoxRuntimeError) {
    npmlog.error('DetoxRuntimeError', '%s', err.stack);

    if (err.hint) {
      npmlog.info('DetoxRuntimeError', 'Hint: %s', err.hint);
    }
    if (err.debugInfo) {
      npmlog.warn('DetoxRuntimeError', 'See debug info below:\n%s', err.debugInfo);
    }
  } else {
    throw err;
  }
}

module.exports = subscribe;
