// @ts-nocheck
const childProcess = require('child_process');

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
    stdout && stdout.on('data', _spawnStdoutLoggerFn(log, logLevelPatterns));
    stderr && stderr.on('data', _spawnStderrLoggerFn(log, logLevelPatterns));
  }

  function onEnd(e) {
    const signal = e.childProcess.signalCode || '';
    const action = signal ? `terminated with ${signal}` : `finished with code = ${e.code}`;

    log.debug({ event: 'SPAWN_END' }, `${cmd} ${action}`);
  }

  result.then(onEnd, onEnd);
  return result;
}

async function execSpawned(binary, flags, options) { // TODO revert this to a spawn-like signature (with explicit bin-path & args)
  const command = _joinCommandAndFlags(binary, flags);
  const {
    retries = 9,
    interval = 1000,
    statusLogs = {},
    ...spawnOptions
  } = options;
  const log = execLogger.child({ fn: 'execSpawned', command });

  let result;
  await retry({ retries, interval }, async (retryNumber, lastError) => {
    if (statusLogs.trying) {
      _logTrying(log, statusLogs.trying, retryNumber, lastError);
    } else if (statusLogs.retrying) {
      _logRetrying(log, command, retryNumber, lastError);
    }
    result = await _execSpawned(binary, flags, spawnOptions);
  });

  return result;
}

// function _spawnAndLogWithResult(command, flags, options) {
//   return new Promise((resolve, reject) => {
//     let result = '';
//
//     const onFulfilled = () => resolve(result.trim());
//     const onRejected = (code) => reject(new Error(`Exited with code #${code}`));
//
//     spawnAndLog(command, flags, options)
//       .then(onFulfilled, onRejected)
//       .childProcess.stdout.on('data', (data) => result += data.toString());
//   });
// }
//

function _execSpawned(command, flags, options) {
  const cmd = _joinCommandAndFlags(command, flags);

  return new Promise((resolve, reject) => {
    let result = '';

    const cp = childProcess.spawn(command, flags, options);
    const log = execLogger.child({ cmd, trackingId: cp.pid });
    log.debug({ event: 'SPAWN_CMD' }, cmd);

    cp.stdout.setEncoding('utf8');
    cp.stderr.setEncoding('utf8');
    cp.stdout.on('data', (data) => result += data);
    cp.stdout.on('data', _spawnStdoutLoggerFn(log, undefined));
    cp.stderr.on('data', _spawnStderrLoggerFn(log, undefined));

    cp.on('error', (code) => reject(`${cmd}\nFailed to execute, exited with code #${code}`));
    cp.on('exit', (code, signal) => {
      cp.stdout.destroy();
      cp.stderr.destroy();

      if (signal !== null) {
        log.debug({ event: 'SPAWN_END', signal }, `Command "${cmd}" killed by signal ${signal}`);
        reject(`${cmd}\nKilled by signal ${signal}`);
      } else if (code !== null && code !== 0) {
        log.debug({ event: 'SPAWN_END', code }, `Command "${cmd}" failed with code #${code}`);
        reject(`${cmd}\nExited with code #${code}`);
      } else {
        log.debug({ event: 'SPAWN_END', code: 0 }, cmd);
        resolve(result);
      }
    });
  });

    // return spawnAndLog(command, flags, { ...options, capture: ['stdout', 'stderr'] });
}

const _spawnStdoutLoggerFn = (log, logLevelPatterns) => (chunk) => {
  const line = chunk.toString();
  const loglevel = _inferLogLevel(line, logLevelPatterns) || 'trace';
  log[loglevel]({ stdout: true, event: 'SPAWN_STDOUT' }, line);
};

const _spawnStderrLoggerFn = (log, logLevelPatterns) => (chunk) => {
  const line = chunk.toString();
  const loglevel = _inferLogLevel(line, logLevelPatterns) || 'error';
  log[loglevel]({ stderr: true, event: 'SPAWN_STDERR' }, line);
};

function _inferLogLevel(msg, patterns) {
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
  execSpawned,
  interruptProcess,
  execAsync
};
