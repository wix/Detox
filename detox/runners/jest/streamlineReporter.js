/*
 * This is here to make it easier for users to apply this reporter in config.json (naming-wise)
 * TODO: rename this file to reporter.js in the next major version (Detox 18)
 */

const DetoxStreamlineJestReporter = require('./DetoxStreamlineJestReporter');
const FailingTestsReporter = require('./FailingTestsReporter');

class DetoxReporter extends DetoxStreamlineJestReporter {
  constructor(globalConfig) {
    super(globalConfig);
    this._failingTestsReporter = new FailingTestsReporter();
  }

  async onRunComplete(contexts, results) {
    await super.onRunComplete(contexts, results);
    await this._failingTestsReporter.onRunComplete(contexts, results);
  }
}

module.exports = DetoxReporter;
