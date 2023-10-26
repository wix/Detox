/** @typedef {import('@jest/reporters').Reporter} Reporter */

const { config, unsafe_conductEarlyTeardown } = require('../../../internals');
const Deferred = require('../../../src/utils/Deferred');

/** @implements {Reporter} */
class DetoxReporterDispatcher {
  /**
   * @param {import('@jest/types').Config.GlobalConfig} globalConfig
   * @param {Record<string, new (globalConfig: import('@jest/types').Config.GlobalConfig) => Partial<Reporter>>} reporters
   */
  constructor(globalConfig, reporters) {
    this._bail = globalConfig.bail;
    /** @type {Deferred | null} */
    this._lastRunComplete = null;
    /** @type {Set<string>} */
    this._pendingTestFiles = new Set();
    /** @type {Promise<any> | null} */
    this._onRunCompletePromise = null;
    /** @type {Partial<Reporter>[]} */
    this._reporters = Object.values(reporters).map((Reporter) => new Reporter(globalConfig));
  }

  getLastError() {
    for (const reporter of this._reporters) {
      let error = typeof reporter.getLastError === 'function'
        ? reporter.getLastError()
        : undefined;

      if (error) {
        return error;
      }
    }

    return;
  }

  onRunStart(aggregatedResult, options) {
    return this._dispatch('onRunStart', aggregatedResult, options);
  }

  onTestFileStart(test) {
    this._pendingTestFiles.add(test.path);
    return this._dispatch(['onTestFileStart', 'onTestStart'], test);
  }

  onTestStart(test) {
    // Legacy method
    return this.onTestFileStart(test);
  }

  // NEW! Supported only since Jest 29.6.0
  onTestCaseStart(test, testCaseStartInfo) {
    return this._dispatch('onTestCaseStart', test, testCaseStartInfo);
  }

  onTestCaseResult(test, testCaseResult) {
    return this._dispatch('onTestCaseResult', test, testCaseResult);
  }

  async onTestFileResult(test, testResult, aggregatedResult) {
    this._pendingTestFiles.delete(test.path);

    await this._dispatch(['onTestFileResult', 'onTestResult'], test, testResult, aggregatedResult);

    if (this._lastRunComplete && this._pendingTestFiles.size === 0) {
      this._lastRunComplete.resolve(aggregatedResult);
    }
  }

  onTestResult(test, testResult, aggregatedResult) {
    // Legacy method
    return this.onTestFileResult(test, testResult, aggregatedResult);
  }

  onRunComplete(testContexts, aggregatedResult) {
    if (!this._lastRunComplete) {
      // Both `_lastRunComplete` and `_onRunCompletePromise` are used to prevent
      // a bug in Jest, where `onRunComplete` is called multiple times when
      // Jest runs with `--bail` and multiple workers, and `onRunComplete`
      // is implemented as an asynchronous long-running operation.
      this._lastRunComplete = this._pendingTestFiles.size === 0
        ? Deferred.resolved(aggregatedResult)
        : new Deferred();
    }

    if (!this._onRunCompletePromise) {
      this._onRunCompletePromise = this._doRunComplete(testContexts, aggregatedResult);
    }

    return this._onRunCompletePromise;
  }

  /**
   * @private
   * @param {Set<import('@jest/reporters').TestContext>} testContexts
   * @param {import('@jest/test-result').AggregatedResult} aggregatedResult
   * @returns {Promise<void>}
   */
  async _doRunComplete(testContexts, aggregatedResult) {
    const earlyTeardown = this._bail > 0 && aggregatedResult.numFailedTests >= this._bail;
    if (earlyTeardown) {
      const lostTests = aggregatedResult.numTotalTestSuites - aggregatedResult.testResults.length;
      if (lostTests > 0 && config.testRunner.retries > 0) {
        console.warn(
          'Jest aborted the test execution before all scheduled test files have been reported.\n' +
          'If you want to retry the whole test run, please disable Jest\'s --bail option.'
        );
      }

      await unsafe_conductEarlyTeardown();
    }

    await this._lastRunComplete.promise;
    await this._dispatch('onRunComplete', testContexts, aggregatedResult);
  }

  /**
   * @private
   * @param {string | string[]} rawMethodNames
   * @param {...any} args
   * @returns {Promise<void>}
   */
  _dispatch(rawMethodNames, ...args) {
    const methodNames = Array.isArray(rawMethodNames)
      ? rawMethodNames
      : [rawMethodNames];

    const maybePromises = [];

    for (const reporter of this._reporters) {
      for (const methodName of methodNames) {
        if (typeof reporter[methodName] === 'function') {
          maybePromises.push(reporter[methodName](...args));
          break;
        }
      }
    }

    return Promise.all(maybePromises).then(() => void 0);
  }
}

module.exports = DetoxReporterDispatcher;
