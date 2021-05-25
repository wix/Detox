const SpecReporterCircus = require('../jest/SpecReporterCircus');
const WorkerAssignReporterCircus = require('../jest/WorkerAssignReporterCircus');

const DetoxCircusEnvironment = require('./environment');

module.exports = {
  DetoxCircusEnvironment,
  SpecReporter: SpecReporterCircus,
  WorkerAssignReporter: WorkerAssignReporterCircus,
};
