const argparse = require('../../src/utils/argparse');
const SpecReporter = require('./SpecReporterImpl');

class SpecReporterCircus {
  constructor() {
    this._specReporter = new SpecReporter();
  }

  run_describe_start(event) {
    if (event.describeBlock.parent !== undefined) {
      this._specReporter.onSuiteStart({
        description: event.describeBlock.name,
      });
    }
  }

  run_describe_finish(event) {
    if (event.describeBlock.parent !== undefined) {
      this._specReporter.onSuiteEnd();
    }
  }

  test_start(event) {
    const { test } = event;
    this._specReporter.onTestStart({
      description: test.name,
      invocations: test.invocations,
    });
  }

  test_done(event) {
    const { test } = event;
    const testInfo = {
      description: test.name,
      invocations: test.invocations,
    };
    this._specReporter.onTestEnd(testInfo, test.errors.length ? 'failed' : 'success');
  }

  test_skip(event) {
    const testInfo = {
      description: event.test.name,
    };
    this._specReporter.onTestEnd(testInfo, 'skipped');
  }
}

module.exports = argparse.getArgValue('reportSpecs') === 'true'
  ? SpecReporterCircus
  : class {};
