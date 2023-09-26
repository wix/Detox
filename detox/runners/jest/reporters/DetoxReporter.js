const resolveFrom = require('resolve-from');
/** @type {new (globalConfig: any) => import('@jest/reporters').VerboseReporter} */
const JestVerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;
/** @type {new (globalConfig: any) => import('@jest/reporters').SummaryReporter} */
const SummaryReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).SummaryReporter;

const { config, reportTestResults, unsafe_conductEarlyTeardown, cleanup } = require('../../../internals');
const Deferred = require('../../../src/utils/Deferred');

class DetoxReporter extends JestVerboseReporter {
  constructor(globalConfig) {
    super(globalConfig);

    /** @type {Deferred | null} */
    this._lastRunComplete = null;
    /** @type {Set<string>} */
    this._pendingTestFiles = new Set();
    /** @type {Promise<any> | null} */
    this._runCompletePromise = null;
    /** @type {import('@jest/reporters').SummaryReporter | null} */
    this._summaryReporter = this._initSummaryReporter();
  }

  onRunStart(aggregatedResults, options) {
    super.onRunStart(aggregatedResults, options);

    if (this._summaryReporter) {
      this._summaryReporter.onRunStart(aggregatedResults, options);
    }
  }

  onTestFileStart(test) {
    this._pendingTestFiles.add(test.path);

    // @ts-ignore Precaution in case Jest migrates to the new signature
    if (typeof super.onTestFileStart === 'function') {
      // @ts-ignore
      super.onTestFileStart(test);
    } else {
      super.onTestStart(test);
    }
  }

  onTestFileResult(test, testResult, aggregatedResult) {
    this._pendingTestFiles.delete(test.path);

    // @ts-ignore Precaution in case Jest migrates to the new signature
    if (typeof super.onTestFileResult === 'function') {
      // @ts-ignore
      super.onTestFileResult(test, testResult, aggregatedResult);
    } else {
      super.onTestResult(test, testResult, aggregatedResult);
    }

    if (this._lastRunComplete && this._pendingTestFiles.size === 0) {
      this._lastRunComplete.resolve(aggregatedResult);
    }
  }

  /**
   * @param {Set<import('@jest/reporters').TestContext>} testContexts
   * @param {import('@jest/reporters').AggregatedResult} aggregatedResult
   * @returns {Promise<any> | null}
   */
  // @ts-ignore We need to use the complete signature, not the one from the base class
  onRunComplete(testContexts, aggregatedResult) {
    if (!this._runCompletePromise) {
      // Both `_lastRunComplete` and `_runCompletePromise` are used to prevent
      // a bug in Jest, where `onRunComplete` is called multiple times when
      // Jest runs with `--bail` and multiple workers, and `onRunComplete`
      // is implemented as an asynchronous long-running operation.
      this._lastRunComplete = this._pendingTestFiles.size === 0
        ? Deferred.resolved(aggregatedResult)
        : new Deferred();

      this._runCompletePromise = this._onRunComplete(testContexts, aggregatedResult).catch(err => {
        console.error(err);
        throw err;
      });
    }

    return this._runCompletePromise;
  }

  /**
   * @param {Set<import('@jest/reporters').TestContext>} testContexts
   * @param {import('@jest/reporters').AggregatedResult} aggregatedResult
   * @returns {Promise<any> | null}
   */
  async _onRunComplete(testContexts, { numFailedTests }) {
    const bail = this._globalConfig.bail;
    const earlyTeardown = bail > 0 && numFailedTests >= bail;
    if (earlyTeardown) {
      await unsafe_conductEarlyTeardown();
    }

    const aggregatedResult = await this._lastRunComplete.promise;
    const lostTests = aggregatedResult.numTotalTestSuites - aggregatedResult.testResults.length;

    // @ts-expect-error TS2554
    super.onRunComplete(testContexts, aggregatedResult);

    if (earlyTeardown && lostTests > 0 && config.testRunner.retries > 0) {
      console.warn(
        'Jest aborted the test execution before all scheduled test files have been reported.\n' +
        'This brings us to a dilemma: retry the whole test run, or retry only known failed test files.\n' +
        'Both options are bad in their own way, this is why we have decided to not support this edge case.\n' +
        'If you want to retry the whole test run, please disable Jest\'s --bail option.'
      );
    }

    await reportTestResults(aggregatedResult.testResults.map(r => ({
      success: !r.failureMessage,
      testFilePath: r.testFilePath,
      testExecError: r.testExecError,
      isPermanentFailure: lostTests > 0 || this._isPermanentFailure(r),
    })));

    if (this._summaryReporter) {
      this._summaryReporter.onRunComplete(testContexts, aggregatedResult);
    }

    if (earlyTeardown) {
      await cleanup();
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
