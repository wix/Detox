module.exports = {
  get DetoxCircusEnvironment() {
    return require('./environment');
  },

  get SpecReporter() {
    return require('./environment/listeners/SpecReporter');
  },

  get WorkerAssignReporter() {
    return require('./environment/listeners/WorkerAssignReporter');
  },
};
