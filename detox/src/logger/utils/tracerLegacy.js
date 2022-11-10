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
};

function installLegacyTracerInterface(logger, target) {
  target.traceCall = methods.traceCall(logger);
  target.trace = Object.freeze({
    startSection: methods.startSection(logger),
    endSection: methods.endSection(logger),
  });

  return this;
}

module.exports = { install: installLegacyTracerInterface };
