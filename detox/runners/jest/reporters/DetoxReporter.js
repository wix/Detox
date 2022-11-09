const resolveFrom = require('resolve-from');
/** @type {typeof import('@jest/reporters').VerboseReporter} */
const JestVerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;

const { config, reportTestResults } = require('../../../internals');

class DetoxReporter extends JestVerboseReporter {
  /**
   * @param {import('@jest/test-result').Test} test
   * @param {import('@jest/test-result').TestResult} testResult
   * @param {import('@jest/test-result').AggregatedResult} aggregatedResult
   * @return {Promise<void>}
   */
  async onTestResult(test, testResult, aggregatedResult) {
    await super.onTestResult(test, testResult, aggregatedResult);

    await reportTestResults([{
      success: !testResult.failureMessage,
      testFilePath: testResult.testFilePath,
      testExecError: testResult.testExecError,
      isPermanentFailure: this._isPermanentFailure(testResult),
    }]);
  }

  /**
   * @param {import('@jest/test-result').TestResult} testResult
   */
  _isPermanentFailure(testResult) {
    if (config.testRunner.jest.retryAfterCircusRetries) {
      return false;
    }

    return testResult.testResults.some(r => r.status === 'failed' && r.invocations > 1);
  }
}

module.exports = DetoxReporter;
