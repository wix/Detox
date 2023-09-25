const resolveFrom = require('resolve-from');
/** @type {new (globalConfig: any) => import('@jest/reporters').VerboseReporter} */
const JestVerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;
/** @type {new (globalConfig: any) => import('@jest/reporters').SummaryReporter} */
const SummaryReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).SummaryReporter;

const { config, reportTestResults } = require('../../../internals');

class DetoxReporter extends JestVerboseReporter {
  constructor(globalConfig) {
    super(globalConfig);
    /** @type {import('@jest/reporters').SummaryReporter | null} */
    this._summaryReporter = this._initSummaryReporter();
    /** @type {Promise<any> | null} */
    this._runCompletePromise = null;
    /** @type {[Set<import('@jest/reporters').TestContext>, import('@jest/reporters').AggregatedResult]} */
    this._lastResults = [null, null];
  }

  onRunStart(aggregatedResults, options) {
    super.onRunStart(aggregatedResults, options);

    if (this._summaryReporter) {
      this._summaryReporter.onRunStart(aggregatedResults, options);
    }
  }

  /**
   * @param {Set<import('@jest/reporters').TestContext>} contexts
   * @param {import('@jest/reporters').AggregatedResult} results
   * @returns {Promise<any> | null}
   */
  // @ts-ignore
  onRunComplete(contexts, results) {
    // Both `_lastResults` and `_runCompletePromise` are used to prevent
    // a bug in Jest, where `onRunComplete` is called multiple times when
    // Jest runs with `--bail` and multiple workers, and `onRunComplete`
    // is implemented as an asynchronous long-running operation.
    this._lastResults = [contexts, results];
    if (!this._runCompletePromise) {
      // @ts-expect-error TS2554: Expected 0 arguments, but got 2.
      super.onRunComplete(...this._lastResults);
      this._runCompletePromise = this._onRunComplete();
    }

    return this._runCompletePromise;
  }

  async _onRunComplete() {
    let results = this._lastResults[1];
    await reportTestResults(results.testResults.map(r => ({
      success: !r.failureMessage,
      testFilePath: r.testFilePath,
      testExecError: r.testExecError,
      isPermanentFailure: this._isPermanentFailure(r),
    })));

    if (this._summaryReporter) {
      this._summaryReporter.onRunComplete(...this._lastResults);
    }
  }

  /**
   * @returns {import('@jest/reporters').SummaryReporter | null}
   * @private
   */
  _initSummaryReporter() {
    /** @type {(config: import('@jest/types').Config.ReporterConfig) => boolean} */
    const isSummaryReporter = (config) => config[0] === 'summary';
    if (this._globalConfig.reporters.some(isSummaryReporter)) {
      return null;
    }

    return new SummaryReporter(this._globalConfig);
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
