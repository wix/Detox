const methods = {
  startSection(logger) {
    return (msg, args) => logger.trace.begin(args, msg);
  },

  endSection(logger) {
    return (msg, args) => logger.trace.end(args);
  },

  traceCall(logger) {
    return (name, action, args = {}) => logger.trace.complete(args, name, action);
  },

  invocationCall(logger) {
    return (sectionName, invocation, action) => {
      return logger.trace.complete({
        cat: 'ws-client,ws-client-invocation',
        data: invocation,
        stack: _getCallStackTrace(),
      }, sectionName, action);
    };
  },
};

function _getCallStackTrace() {
  return new Error().stack
    .split('\n')
    .slice(1) // Ignore Error message
    .map(line => line
      .replace(/^\s*at\s+/, '')
      .replace(process.cwd(), '')
    )
    .filter(line => !line.includes('/detox/src')) // Ignore detox internal calls
    .join('\n');
}

function installLegacyTracerInterface(logger, target) {
  target.traceCall = methods.traceCall(logger);
  target.trace = Object.freeze({
    startSection: methods.startSection(logger),
    endSection: methods.endSection(logger),
    invocationCall: methods.invocationCall(logger),
  });

  return this;
}

module.exports = { install: installLegacyTracerInterface };
