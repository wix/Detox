const path = require('path');
const { saveLastFailedTests } = require('../../src/utils/lastFailedTests');

class FailingTestsReporter {
  async onRunComplete(_contexts, { testResults }) {
    const cwd = process.cwd();
    const failedFiles = testResults
      .filter(result => result.numFailingTests > 0)
      .map(result => path.relative(cwd, result.testFilePath));

    await saveLastFailedTests(failedFiles);
  }
}

module.exports = FailingTestsReporter;
