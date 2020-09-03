const { saveLastFailedTests } = require('../../src/utils/lastFailedTests');

class FailingTestsReporter {
  async onRunComplete(_contexts, { testResults }) {
    const failedFiles = testResults
      .filter(result => result.numFailingTests > 0)
      .map(result => result.testFilePath);

    await saveLastFailedTests(failedFiles);
  }
}

module.exports = FailingTestsReporter;
