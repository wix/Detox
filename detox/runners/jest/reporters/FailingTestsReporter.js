const path = require('path');

const detoxInternals = require('../../../internals');

class FailingTestsReporter {
  async onRunComplete(_contexts, { testResults }) {
    const cwd = process.cwd();
    const failedFiles = testResults
      .filter(result => result.numFailingTests > 0)
      .map(result => path.relative(cwd, result.testFilePath));

    await detoxInternals.reportFailedTests(failedFiles);
  }
}

module.exports = FailingTestsReporter;
