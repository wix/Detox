const resolveFrom = require('resolve-from');
/** @type {typeof import('@jest/reporters').VerboseReporter} */
const JestVerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;

const { config, reportTestResults } = require('../../../internals');

class DetoxReporter extends JestVerboseReporter {
  /**
   * @param {import('@jest/test-result').AggregatedResult} results
   */
  // @ts-ignore
  async onRunComplete(_contexts, results) {
    // @ts-ignore
    await super.onRunComplete(_contexts, results);

    await reportTestResults(results.testResults.map(r => ({
      success: !r.failureMessage,
      testFilePath: r.testFilePath,
      testExecError: r.testExecError,
      isPermanentFailure: this._isPermanentFailure(r),
    })));
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
