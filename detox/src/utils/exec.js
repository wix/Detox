const _ = require('lodash');
const {exec, spawn} = require('child-process-promise');
const execLogger = require('./logger').child({ __filename });
const retry = require('./retry');
const { escape } = require('./pipeCommands');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');

let _operationCounter = 0;

async function execWithRetriesAndLogs(bin, options, statusLogs, retries = 10, interval = 1000) {
  const trackingId = _operationCounter++;
  const cmd = _composeCommand(bin, options);
  const execTimeout = _.get(options, 'timeout', 0);
  const log = execLogger.child({ fn: 'execWithRetriesAndLogs', cmd, trackingId });
  log.debug({ event: 'EXEC_CMD' }, `${cmd}`);

  let result;
  try {
    await retry({retries, interval}, async (retryNumber) => {
      if (statusLogs && statusLogs.trying) {
        log.debug({ event: 'EXEC_TRY', retryNumber }, statusLogs.trying);
      }

      result = await exec(cmd, { timeout: execTimeout });
    });
  } catch (err) {
    const _failReason = err.code == null && execTimeout > 0
      ? `timeout = ${execTimeout}ms`
      : `code = ${err.code}`;

    const silent = _.get(options, 'silent', false);
    const level = silent ? 'debug' : 'error';

    log[level]({ event: 'EXEC_FAIL' }, `"${cmd}" failed with ${_failReason}, stdout and stderr:\n`);
    log[level]({ event: 'EXEC_FAIL', stdout: true }, err.stdout);
    log[level]({ event: 'EXEC_FAIL', stderr: true }, err.stderr);

    throw err;
  }

  if (result === undefined) {
    log.error({ event: 'EXEC_UNDEFINED' }, `command returned undefined`);
    throw new DetoxRuntimeError(`command ${cmd} returned undefined`);
  }

  _logExecOutput(log, result);

  if (statusLogs && statusLogs.successful) {
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
function _logExecOutput(log, process) {
  let stdout = process.stdout || '';
  let stderr = process.stderr || '';

  if (process.platform === 'win32') {
    stdout = stdout.replace(/\r\n/g, '\n');
    stderr = stderr.replace(/\r\n/g, '\n');
  }

  if (stdout) {
    log.trace({ event: 'EXEC_SUCCESS', stdout: true }, stdout);
  }

  if (stderr) {
    log.trace({ event: 'EXEC_SUCCESS', stderr: true }, stderr);
  }

  if (!stdout && !stderr) {
    log.trace({ event: 'EXEC_SUCCESS' }, '');
  }
}

function _composeCommand(bin, options) {
  if (!options) {
    return bin;
  }

  const prefix = options.prefix ? `${options.prefix} && ` : '';
  const args = options.args ? ` ${options.args}` : '';

  return `${prefix}${bin}${args}`;
}

function spawnAndLog(command, flags, options) {
  const trackingId = _operationCounter++;
  const cmd = _joinCommandAndFlags(command, flags);
  const log = execLogger.child({ fn: 'spawnAndLog', cmd, trackingId });

  const result = spawn(command, flags, {stdio: ['ignore', 'pipe', 'pipe'], ...options});
  const { childProcess } = result;
  const { exitCode, stdout, stderr } = childProcess;

  log.debug({ event: 'SPAWN_CMD' }, `[pid=${childProcess.pid}] ${cmd}`);

  if (exitCode != null && exitCode !== 0) {
    log.error({ event: 'SPAWN_ERROR' }, `${cmd} failed with code = ${exitCode}`);
  }

  stdout.on('data', (chunk) => log.trace({ stdout: true, event: 'SPAWN_STDOUT' }, chunk.toString()));
  stderr.on('data', (chunk) => log.error({ stderr: true, event: 'SPAWN_STDERR' }, chunk.toString()));

  function onEnd(e) {
    const signal = e.childProcess.signalCode || '';
    const action = signal ? `terminated with ${signal}` : `finished with code = ${e.code}`;

    log.trace({ event: 'SPAWN_END' }, `${cmd} ${action}`);
  }

  result.then(onEnd, onEnd);
  return result;
}

function _joinCommandAndFlags(command, flags) {
  let result = command;

  for (const flag of flags.map(String)) {
    result += ' ' + (flag.indexOf(' ') === -1 ? flag : `"${escape.inQuotedString(flag)}"`);
  }

  return result;
}

async function interruptProcess(childProcessPromise, signal = 'SIGINT') {
  const log = execLogger.child({ fn: 'interruptProcess' });

  const childProcess = childProcessPromise.childProcess;
  const pid = childProcess.pid;
  const spawnargs = childProcess.spawnargs.join(' ');

  log.debug({ event: 'KILL', signal, process_pid: pid }, `sending ${signal} to [pid = ${pid}]: ${spawnargs}`);

  childProcess.kill(signal);
  await childProcessPromise.catch(e => {
    /* istanbul ignore if */
    if (e.exitCode != null) {
      throw e;
    }
  });
}

module.exports = {
  execWithRetriesAndLogs,
  spawnAndLog,
  interruptProcess,
};

