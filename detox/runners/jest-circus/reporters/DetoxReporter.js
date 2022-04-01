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
