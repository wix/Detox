const { config, reportTestResults } = require('../../../internals');

/** @typedef {import('@jest/reporters').Reporter} Reporter */

/** @implements {Partial<Reporter>} */
class DetoxIPCReporter {
  /**
   * @param {Set<import('@jest/reporters').TestContext>} testContexts
   * @param {import('@jest/reporters').AggregatedResult} aggregatedResult
   */
  async onRunComplete(testContexts, aggregatedResult) {
    const lostTests = aggregatedResult.numTotalTestSuites - aggregatedResult.testResults.length;

    await reportTestResults(aggregatedResult.testResults.map(r => ({
      success: !r.failureMessage,
      testFilePath: r.testFilePath,
      testExecError: r.testExecError,
      isPermanentFailure: lostTests > 0 || this._isPermanentFailure(r),
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

module.exports = DetoxIPCReporter;
