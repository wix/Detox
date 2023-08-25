const plockfile = require('proper-lockfile');

const environment = require('./environment');

let result = undefined;

function detectConcurrentDetox() {
  if (result !== false) {
    try {
      plockfile.lockSync(environment.getDetoxLockFilePath());
      result = false;
    } catch (e) {
      result = true;
    }
  }

  return result;
}

module.exports = detectConcurrentDetox;
