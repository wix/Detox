const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const execLogger = require('../utils/logger').child({ __filename });
const retry = require('../utils/retry');
const {exec, spawn} = require('child-process-promise');

let _operationCounter = 0;

async function execWithRetriesAndLogs(bin, options, statusLogs, retries = 10, interval = 1000) {
  const trackingId = _operationCounter++;

  let cmd;
  if (options) {
    cmd = `${options.prefix ? options.prefix + ' && ' : ''}${bin} ${options.args}`;
  } else {
    cmd = bin;
  }

  const log = execLogger.child({ fn: 'execWithRetriesAndLogs', cmd, trackingId });
  log.debug({ event: 'EXEC_CMD' }, `${cmd}`);

  let result;

  try {
    await retry({retries, interval}, async (retryNumber) => {
      if (statusLogs && statusLogs.trying) {
        log.debug({ event: 'EXEC_TRY', retryNumber }, statusLogs.trying);
      }

      result = await exec(cmd);
    });
  } catch (err) {
    log.error({ event: 'EXEC_FAIL' }, `"${cmd}" failed with code = ${err.code}, stdout and stderr:\n`);
    log.error({ event: 'EXEC_FAIL', stdout: true }, err.stdout);
    log.error({ event: 'EXEC_FAIL', stderr: true }, err.stderr);

    throw err;
  }

  if (result === undefined) {
    log.error({ event: 'EXEC_UNDEFINED' }, `command returned undefined`);
    throw new DetoxRuntimeError(`command ${cmd} returned undefined`);
  }

  if (result.stdout) {
    log.trace({ event: 'EXEC_SUCCESS', stdout: true }, result.stdout);
  }

  if (result.stderr) {
    log.trace({ event: 'EXEC_SUCCESS', stderr: true }, result.stderr);
  }

  if (statusLogs && statusLogs.successful) {
    log.debug({ event: 'EXEC_SUCCESS' }, statusLogs.successful);
  }

  //if (result.childProcess.exitCode !== 0) {
  //  log.error(`${_operationCounter}: stdout:`, result.stdout);
  //  log.error(`${_operationCounter}: stderr:`, result.stderr);
  //}

  /* istanbul ignore next */
  if (process.platform === 'win32') {
    if (result.stdout) {
      result.stdout = result.stdout.replace(/\r\n/g, '\n');
    }
    if (result.stderr) {
      result.stderr = result.stderr.replace(/\r\n/g, '\n');
    }
  }

  return result;
}

function spawnAndLog(command, flags, options) {
  const trackingId = _operationCounter++;
  const cmd = [command, ...flags].join(' ');
  const log = execLogger.child({ fn: 'spawnAndLog', cmd, trackingId });

  const result = spawn(command, flags, {stdio: ['ignore', 'pipe', 'pipe'], detached: true, ...options});
  const { childProcess } = result;
  const { stdout, stderr } = childProcess;

  log.debug({ event: 'SPAWN_CMD' }, `[pid=${childProcess.pid}] ${cmd}`);

  stdout.on('data', (chunk) => log.trace({ stdout: true, event: 'SPAWN_STDOUT' }, chunk.toString()));
  stderr.on('data', (chunk) => log.trace({ stderr: true, event: 'SPAWN_STDERR' }, chunk.toString()));

  if (childProcess.exitCode != null && childProcess.exitCode !== 0) {
    log.error({ event: 'SPAWN_ERROR' }, `${cmd} failed with code = ${e.code}.`);
  }

  function onEnd(e) {
    const signal = e.childProcess.signalCode || '';
    const action = signal ? `terminated with ${signal}` : `finished with code = ${e.code}`;

    log.trace({ event: 'SPAWN_END' }, `${cmd} ${action}`);
  }

  return result.then(onEnd, onEnd);
}

module.exports = {
  execWithRetriesAndLogs,
  spawnAndLog
};

