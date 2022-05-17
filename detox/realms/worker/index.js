const NullLogger = require('../../src/logger/NullLogger');
const log = new NullLogger();

module.exports = {
  log,
  DetoxCircusEnvironment: require('./environment'),
  SpecReporter: require('./environment/listeners/SpecReporter'),
  WorkerAssignReporter: require('./environment/listeners/WorkerAssignReporter'),
};
