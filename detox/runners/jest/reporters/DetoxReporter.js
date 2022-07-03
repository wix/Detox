const { VerboseReporter: JestVerboseReporter } = require('@jest/reporters'); // eslint-disable-line node/no-extraneous-require

const detoxInternals = require('../../../internals');

const FailingTestsReporter = require('./FailingTestsReporter');

class DetoxReporter extends JestVerboseReporter {
  constructor(globalConfig) {
    super(globalConfig);
    this._failingTestsReporter = new FailingTestsReporter();
  }

  async onRunComplete(contexts, results) {
    // @ts-ignore
    await super.onRunComplete(contexts, results);

    try {
      await detoxInternals.init();
      await this._failingTestsReporter.onRunComplete(contexts, results);
    } finally {
      await detoxInternals.cleanup();
    }
  }
}

module.exports = DetoxReporter;
