/** @typedef {import('@jest/reporters').Reporter} Reporter */

const {
  DetoxIPCReporter,
  DetoxReporterDispatcher,
  DetoxSummaryReporter,
  DetoxVerboseReporter,
} = require('./reporters');

/** @implements {Reporter} */
class DetoxReporter extends DetoxReporterDispatcher {
  constructor(globalConfig) {
    super(globalConfig, {
      DetoxVerboseReporter,
      DetoxSummaryReporter,
      DetoxIPCReporter,
    });
  }
}

module.exports = DetoxReporter;
