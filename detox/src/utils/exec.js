const { exec, spawn } = require('child-process-promise');
const _ = require('lodash');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

const execLogger = require('./logger').child({ __filename });
const { escape } = require('./pipeCommands');
const retry = require('./retry');

let _operationCounter = 0;

async function execWithRetriesAndLogs(bin, options = {}) {
  const {
    retries = 9,
    interval = 1000,
    prefix = null,
    args = null,
    timeout = 0,
    statusLogs = {},
    verbosity = 'normal',
  } = options;

  const trackingId = _operationCounter++;
  const cmd = _composeCommand(bin, prefix, args);
  const log = execLogger.child({ fn: 'execWithRetriesAndLogs', cmd, trackingId });

  let result;
  try {
    log.debug({ event: 'EXEC_CMD' }, `${cmd}`);

    await retry({ retries, interval }, async (retryNumber, lastError) => {
      if (statusLogs.trying) {
        _logTrying(log, statusLogs.trying, retryNumber, lastError);
      } else if (statusLogs.retrying) {
        _logRetrying(log, cmd, retryNumber, lastError);
      }
      result = await exec(cmd, { timeout });
    });
  } catch (err) {
    const _failReason = err.code == null && timeout > 0
      ? `timeout = ${timeout}ms`
      : `error = ${err} (code=${err.code})`;

    const level = (verbosity === 'low' ? 'debug' : 'error');

    log[level]({ event: 'EXEC_FAIL' }, `"${cmd}" failed with ${_failReason}, stdout and stderr:\n`);
    log[level]({ event: 'EXEC_FAIL', stdout: true }, err.stdout);
    log[level]({ event: 'EXEC_FAIL', stderr: true }, err.stderr);

    throw err;
  }

  if (result === undefined) {
    log.error({ event: 'EXEC_UNDEFINED' }, `command returned undefined`);
    throw new DetoxRuntimeError(`command ${cmd} returned undefined`);
  }

  _logExecOutput(log, result, verbosity === 'high' ? 'debug' : 'trace');

  if (statusLogs.successful) {
    log.debug({ event: 'EXEC_SUCCESS' }, statusLogs.successful);
  }

  //if (result.childProcess.exitCode !== 0) {
  //  log.error(`${_operationCounter}: stdout:`, result.stdout);
  //  log.error(`${_operationCounter}: stderr:`, result.stderr);
  //}

  if (typeof result.stdout === 'string') {
    result.stdout = result.stdout.replace(/\r\n/g, '\n');
  }

  if (typeof result.stderr === 'string') {
    result.stderr = result.stderr.replace(/\r\n/g, '\n');
  }

  return result;
}

/* istanbul ignore next */
function _logExecOutput(log, process, level) {
  let stdout = process.stdout || '';
  let stderr = process.stderr || '';

  if (process.platform === 'win32') {
    stdout = stdout.replace(/\r\n/g, '\n');
    stderr = stderr.replace(/\r\n/g, '\n');
  }

  if (stdout) {
    log[level]({ event: 'EXEC_SUCCESS', stdout: true }, stdout);
  }

  if (stderr) {
    log[level]({ event: 'EXEC_SUCCESS', stderr: true }, stderr);
  }

  if (!stdout && !stderr) {
    log[level]({ event: 'EXEC_SUCCESS' }, '');
  }
}

function _logTrying(log, message, retryNumber, lastError) {
  if (lastError && lastError.stderr) {
    log.trace({ event: 'EXEC_TRY_FAIL' }, lastError.stderr);
  }
  log.debug({ event: 'EXEC_TRY', retryNumber }, message);
}

function _logRetrying(log, message, retryNumber, lastError) {
  if (retryNumber > 1) {
    log.trace({ event: 'EXEC_TRY_FAIL' }, lastError.stderr);
    log.debug({ event: 'EXEC_RETRY', retryNumber }, `(Retry #${retryNumber - 1})`, message);
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

function spawnAndLog(command, flags, options) {
  const cmd = _joinCommandAndFlags(command, flags);

  const { logLevelPatterns, silent, ...spawnOptions } = { stdio: ['ignore', 'pipe', 'pipe'], ...options };
  const result = spawn(command, flags, spawnOptions);
  const { childProcess } = result;
  const { exitCode, stdout, stderr } = childProcess;

  const log = execLogger.child({ cmd, trackingId: childProcess.pid });
  log.debug({ event: 'SPAWN_CMD' }, `${cmd}`);

  if (exitCode != null && exitCode !== 0) {
    log.error({ event: 'SPAWN_ERROR' }, `${cmd} failed with code = ${exitCode}`);
  }

  if (!silent) {
    stdout && stdout.on('data', (chunk) => {
      const line = chunk.toString();
      const loglevel = inferLogLevel(line, logLevelPatterns) || 'trace';
      log[loglevel]({ stdout: true, event: 'SPAWN_STDOUT' }, line);
    });

    stderr && stderr.on('data', (chunk) => {
      const line = chunk.toString();
      const loglevel = inferLogLevel(line, logLevelPatterns) || 'error';
      log[loglevel]({ stderr: true, event: 'SPAWN_STDERR' }, line);
    });
  }

  function onEnd(e) {
    const signal = e.childProcess.signalCode || '';
    const action = signal ? `terminated with ${signal}` : `finished with code = ${e.code}`;

    log.debug({ event: 'SPAWN_END' }, `${cmd} ${action}`);
  }

  result.then(onEnd, onEnd);
  return result;
}

function inferLogLevel(msg, patterns) {
  if (_.isEmpty(patterns)) {
    return;
  }

  const matchesRegex = r => r.test(msg);

  return _.findKey(patterns, (regexps) => {
    return regexps.some(matchesRegex);
  });
}

function _joinCommandAndFlags(command, flags) {
  let result = command;

  for (const flag of flags.map(String)) {
    result += ' ' + (flag.indexOf(' ') === -1 ? flag : `"${escape.inQuotedString(flag)}"`);
  }

  return result;
}

const DEFAULT_KILL_SCHEDULE = {
  SIGINT: 0,
};

async function interruptProcess(childProcessPromise, schedule) {
  const childProcess = childProcessPromise.childProcess;
  const pid = childProcess.pid;
  const spawnargs = childProcess.spawnargs.join(' ');
  const log = execLogger.child({ event: 'SPAWN_KILL', trackingId: pid });

  const handles = _.mapValues({ ...DEFAULT_KILL_SCHEDULE, ...schedule }, (ms, signal) => {
    return setTimeout(() => {
      log.trace({ signal }, `sending ${signal} to: ${spawnargs}`);
      childProcess.kill(signal);
    }, ms);
  });

  try {
    await childProcessPromise.catch(e => {
      /* istanbul ignore if */
      if (e.exitCode != null) {
        throw e;
      }
    });
  } finally {
    _.forEach(handles, handle => clearTimeout(handle));
  }
}

async function execAsync(command) {
  const result = await exec(command);
  return _.trim(result.stdout);
}
module.exports = {
  execWithRetriesAndLogs,
  spawnAndLog,
  interruptProcess,
  execAsync
};
