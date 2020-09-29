const fs = require('fs-extra');
const environment = require('./environment');

async function resetLastFailedTests() {
  const lastFailedTxt = environment.getLastFailedTestsPath();
  await fs.remove(lastFailedTxt);
}

async function loadLastFailedTests() {
  const lastFailedTxt = environment.getLastFailedTestsPath();
  const lastFailedTests = await fs.exists(lastFailedTxt)
    ? (await fs.readFile(lastFailedTxt, 'utf8')).trim()
    : '';

  if (lastFailedTests) {
    return lastFailedTests.split('\n');
  } else {
    return [];
  }
}

/**
 * @async
 * @param {string[]} failedFiles - paths to the test suites
 */
async function saveLastFailedTests(failedFiles) {
  const failedTestsPath = environment.getLastFailedTestsPath();

  await fs.ensureFile(failedTestsPath);
  await fs.writeFile(failedTestsPath, failedFiles.join('\n'));
}

module.exports = {
  resetLastFailedTests,
  loadLastFailedTests,
  saveLastFailedTests,
};
