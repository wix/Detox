module.exports = {
  startSection(logger) {
    return (msg, args) => logger.trace.begin(args, msg);
  },

  endSection(logger) {
    return (msg, args) => logger.trace.end(args, 'end');
  },

  traceCall(logger) {
    return (name, action) => logger.trace.complete(name, action);
  },
};
