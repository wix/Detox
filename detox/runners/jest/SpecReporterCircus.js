const CircusTestEventListenerBase = require('./CircusTestEventListenerBase');
const SpecReporter = require('./SpecReporterImpl');

class SpecReporterCircus extends CircusTestEventListenerBase {
  constructor() {
    super();
    this._specReporter = new SpecReporter();
  }

  onRunDescribeStart(event) {
    if (event.describeBlock.parent !== undefined) {
      this._specReporter.onSuiteStart({
        description: event.describeBlock.name,
      });
    }
  }

  onRunDescribeFinish(event) {
    if (event.describeBlock.parent !== undefined) {
      this._specReporter.onSuiteEnd();
    }
  }

  onTestStart(event) {
    this._specReporter.onTestStart({
      description: event.test.name,
    });
  }

  onTestDone(event) {
    const { test } = event;
    const testInfo = {
      description: test.name,
    };
    this._specReporter.onTestEnd(testInfo, test.errors.length ? 'failed' : 'success');
  }

  onTestSkip(event) {
    const testInfo = {
      description: event.test.name,
    };
    this._specReporter.onTestEnd(testInfo, 'skipped');
  }
}

module.exports = SpecReporterCircus;
