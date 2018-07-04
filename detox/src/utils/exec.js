const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const execLogger = require('../utils/logger').child({ __filename });
const retry = require('../utils/retry');
const {exec, spawn} = require('child-process-promise');

let _operationCounter = 0;

async function execWithRetriesAndLogs(bin, options, statusLogs, retries = 10, interval = 1000) {
  const sequentialId = _operationCounter++;

  let cmd;
  if (options) {
    cmd = `${options.prefix ? options.prefix + ' && ' : ''}${bin} ${options.args}`;
  } else {
    cmd = bin;
  }

  const log = execLogger.child({ fn: 'execWithRetriesAndLogs', cmd, sequentialId });
  log.debug({ event: 'EXEC_CMD' }, `${cmd}`);

  let result;

  try {
    await retry({retries, interval}, async (retryNumber) => {
      if (statusLogs && statusLogs.trying) {
        log.info({ retryNumber }, statusLogs.trying);
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
    log.debug({ event: 'EXEC_SUCCESS', stdout: true }, result.stdout);
  }

  if (result.stderr) {
    log.debug({ event: 'EXEC_SUCCESS', stderr: true }, result.stderr);
  }

  if (statusLogs && statusLogs.successful) {
    log.info({ event: 'EXEC_SUCCESS' }, statusLogs.successful);
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
  const sequentialId = _operationCounter++;

  const cmd = `${command} ${flags.join(' ')}`;
  let log = execLogger.child({ fn: 'spawnAndLog', cmd, sequentialId });
  log.debug({ event: 'SPAWN_CMD' }, cmd);

  const result = spawn(command, flags, {stdio: ['ignore', 'pipe', 'pipe'], detached: true, ...options});

  if (result.childProcess) {
    const {pid, stdout, stderr} = result.childProcess;
    log = log.child({ child_pid: pid });

    log.debug({ event: 'SPAWN_SUCCESS' }, `spawned child process with pid = ${pid}`);
    stdout.on('data', (chunk) => log.debug({ stdout: true }, chunk.toString()));
    stderr.on('data', (chunk) => log.debug({ stderr: true }, chunk.toString()));
    result.childProcess.on('end', (code, signal) => {
      log.debug({ event: 'SPAWN_END' }, `child process received signal ${signal} and exited with code = ${code}`);
    })
  }

  return result;
}

module.exports = {
  execWithRetriesAndLogs,
  spawnAndLog
};

