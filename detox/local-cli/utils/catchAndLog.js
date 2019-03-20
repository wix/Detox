let throwErrors = false;

function catchAndLog(logger, handler) {
  return handler;

  return async function wrappedHandlerInCatchAndLog() {
    try {
      return (await handler.apply(this, arguments));
    } catch (e) {
      if (throwErrors) {
        throw e;
      }

      for (const line of e.toString().split('\n')) {
        logger.error(line);
      }

      process.exit(1); // eslint-disable-line no-process-exit
    }
  };
}

catchAndLog.throwErrors = (value = true) => {
  throwErrors = value;
  return catchAndLog;
};

module.exports = catchAndLog;
