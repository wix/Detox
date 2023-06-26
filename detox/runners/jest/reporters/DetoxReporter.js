const resolveFrom = require('resolve-from');
/** @type {typeof import('@jest/reporters').VerboseReporter} */
const JestVerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;

const { config, reportTestResults, unsafe_conductEarlyTeardown } = require('../../../internals');

class DetoxReporter extends JestVerboseReporter {
  constructor(globalConfig) {
    super(globalConfig);
    this._shouldWaitForRunner = globalConfig.bail;
  }

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

    if (this._shouldWaitForRunner) {
      await unsafe_conductEarlyTeardown();
    }
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
