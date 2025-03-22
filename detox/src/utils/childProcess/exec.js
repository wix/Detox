// @ts-nocheck
const _ = require('lodash');
const { exec } = require('promisify-child-process');

const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const rootLogger = require('../logger').child({ cat: ['child-process', 'child-process-exec'] });
const retry = require('../retry');

const execsCounter = require('./opsCounter');

/**
 * Executes a command with retries and logs
 * @param {*} bin - command to execute
 * @param {*} options - options
 * @returns {Promise<import('promisify-child-process').Output>}
 */
async function execWithRetriesAndLogs(bin, options = {}) {
  const {
    retries = 9,
    interval = 1000,
    backoff,
    prefix = null,
    args = null,
    timeout,
    statusLogs = {},
    verbosity = 'normal',
    maxBuffer,
  } = options;

  const trackingId = execsCounter.inc();
  const cmd = _composeCommand(bin, prefix, args);
  const logger = rootLogger.child({ fn: 'execWithRetriesAndLogs', cmd, trackingId });
  const logLevelSuccess = (verbosity === 'high' ? 'debug' : 'trace');
  const logLevelFail = (verbosity === 'low' ? 'debug' : 'error');

  let result;
  try {
    logger.debug({ event: 'EXEC_CMD' }, `${cmd}`);

    await retry({ retries, interval, backoff }, async (tryNumber, lastError) => {
      if (statusLogs.trying) {
        _logExecTrying(logger, statusLogs.trying, tryNumber, lastError);
      } else if (statusLogs.retrying) {
        _logExecRetrying(logger, cmd, tryNumber, lastError);
      }
      result = await exec(cmd, _.omitBy({ timeout, maxBuffer }, _.isUndefined));
    });
  } catch (err) {
    const failReason = err.code == null && timeout > 0
      ? `timeout = ${timeout}ms`
      : `error = ${err} (code=${err.code})`;
    _logExecFail(logger, logLevelFail, cmd, err, failReason);
    throw err;
  }

  if (result === undefined) {
    logger.error({ event: 'EXEC_UNDEFINED' }, `command returned undefined`);
    throw new DetoxRuntimeError(`command ${cmd} returned undefined`);
  }

  _logExecOutput(logger, logLevelSuccess, result);
  _logExecSuccess(logger, logLevelSuccess, result, statusLogs.successful);

  if (typeof result.stdout === 'string') {
    result.stdout = result.stdout.replace(/\r\n/g, '\n');
  }

  if (typeof result.stderr === 'string') {
    result.stderr = result.stderr.replace(/\r\n/g, '\n');
  }

  return result;
}

/* istanbul ignore next */
function _logExecOutput(logger, level, execResult) {
  let stdout = execResult.stdout || '';
  let stderr = execResult.stderr || '';

  if (execResult.platform === 'win32') {
    stdout = stdout.replace(/\r\n/g, '\n');
    stderr = stderr.replace(/\r\n/g, '\n');
  }

  if (stdout) {
    logger[level]({ event: 'EXEC_SUCCESS', stdout: true }, stdout);
  }

  if (stderr) {
    logger[level]({ event: 'EXEC_SUCCESS', stderr: true }, stderr);
  }
}

function _logExecFail(logger, level, command, err, reason) {
  logger[level]({ event: 'EXEC_FAIL' }, `"${command}" failed with ${reason}, stdout and stderr:\n`);
  logger[level]({ event: 'EXEC_FAIL', stdout: true }, err.stdout);
  logger[level]({ event: 'EXEC_FAIL', stderr: true }, err.stderr);
}

function _logExecSuccess(logger, level, execResult, message) {
  if (message) {
    logger.debug({ event: 'EXEC_SUCCESS' }, message);
  } else if (!execResult.stdout && !execResult.stderr) {
    logger[level]({ event: 'EXEC_SUCCESS' }, '');
  }
}

function _logExecTrying(log, message, retryNumber, lastError) {
  if (lastError && lastError.stderr) {
    log.trace({ event: 'EXEC_TRY_FAIL' }, lastError.stderr);
  }
  log.debug({ event: 'EXEC_TRY', retryNumber }, message);
}

function _logExecRetrying(log, message, tryNumber, lastError) {
  if (tryNumber > 1) {
    log.trace({ event: 'EXEC_TRY_FAIL' }, lastError.stderr);
    log.debug({ event: 'EXEC_RETRY' }, `(Retry #${tryNumber - 1})`, message);
  }
}

function _composeCommand(bin, prefix, args) {
  if (!(prefix || args)) {
    return bin;
  }

  const _prefix = prefix ? `${prefix} && ` : '';
  const _args = args ? ` ${args}` : '';

  return `${_prefix}${bin}${_args}`;
}

async function execAsync(command) {
  const result = await exec(command);
  return _.trim(result.stdout);
}
module.exports = {
  execWithRetriesAndLogs,
  execAsync
};
