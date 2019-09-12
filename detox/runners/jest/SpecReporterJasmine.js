const SpecReporter = require('./SpecReporterImpl');

/***
 * @see {@link https://jasmine.github.io/api/2.9/Reporter.html}
 */
class SpecReporterJasmine {
  constructor() {
    this._specReporter = new SpecReporter();
  }

  suiteStarted(suiteInfo) {
    this._specReporter.onSuiteStart(suiteInfo);
  }

  suiteDone() {
    this._specReporter.onSuiteEnd();
  }

  specStarted(specInfo) {
    this._specReporter.onTestStart(specInfo);
  }

  specDone(specResult) {
    let result;
    if (specResult.status === 'disabled') {
      result = 'skipped';
    } else if (specResult.status === 'failed') {
      result = 'failed';
    } else if (specResult.pendingReason) {
      result = 'pending';
    } else {
      result = 'success';
    }

    this._specReporter.onTestEnd(specResult, result);
  }
}

module.exports = SpecReporterJasmine;
