const resolveFrom = require('resolve-from');
/** @type {typeof import('@jest/reporters').VerboseReporter} */
const JestVerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;

const { config, reportTestResults } = require('../../../internals');

class DetoxReporter extends JestVerboseReporter {
  /**
   * @param {import('@jest/test-result').TestResult} testResult
   */
  async onTestResult(test, testResult, results) {
    await super.onTestResult(test, testResult, results);

    await reportTestResults([{
      success: !testResult.failureMessage,
      testFilePath: testResult.testFilePath,
      testExecError: testResult.testExecError,
      isPermanentFailure: config.testRunner.jest.retryAfterCircusRetries
        ? false
        : testResult.testResults.some(r => r.invocations > 1)
    }]);
  }
}

module.exports = DetoxReporter;
