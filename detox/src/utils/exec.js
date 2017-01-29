const log = require('npmlog');
const retry = require('../utils/retry');
const exec = require('child-process-promise').exec;

let _operationCounter = 0;

async function execWithRetriesAndLogs(cmd, options, statusLogs, retries = 10, interval = 1000) {
  _operationCounter++;
  if (!options.args) {
    throw new Error(`optins.args must be specified`);
  }

  log.verbose(`${_operationCounter}: ${cmd}`);

  let result;
  await retry({retries, interval}, async() => {
    if (statusLogs && statusLogs.trying) {
      log.info(`${_operationCounter}: ${statusLogs.trying}`);
    }
    result = await exec(cmd);
  });
  if (result === undefined) {
    throw new Error(`${_operationCounter}: ${cmd} could not run`);
  }

  if (result.stdout) {
    log.verbose(`${_operationCounter}: stdout:`, result.stdout);
  }

  if (result.stderr) {
    log.verbose(`${_operationCounter}: stderr:`, result.stderr);
  }

  if (statusLogs && statusLogs.successful) {
    log.info(`${_operationCounter}: ${statusLogs.successful}`);
  }

  if (result.childProcess.exitCode !== 0) {
    log.error(`${_operationCounter}: stdout:`, result.stdout);
    log.error(`${_operationCounter}: stderr:`, result.stderr);
  }

  return result;
}

module.exports = {
  execWithRetriesAndLogs
};

