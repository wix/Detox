const { VerboseReporter: JestVerboseReporter } = require('@jest/reporters'); // eslint-disable-line node/no-extraneous-require

const FailingTestsReporter = require('./FailingTestsReporter');

class DetoxReporter extends JestVerboseReporter {
  constructor(globalConfig) {
    super(globalConfig);
    this._failingTestsReporter = new FailingTestsReporter();
  }

  async onRunComplete(contexts, results) {
    // @ts-ignore
    await super.onRunComplete(contexts, results);
    await this._failingTestsReporter.onRunComplete(contexts, results);
  }
}

module.exports = DetoxReporter;
