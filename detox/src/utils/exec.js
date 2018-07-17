const log = require('npmlog');
const retry = require('../utils/retry');
const {exec, spawn} = require('child-process-promise');

let _operationCounter = 0;

/**

 */
async function execWithRetriesAndLogs(bin, options, statusLogs, retries = 10, interval = 1000) {
  _operationCounter++;

  let cmd;
  if (options) {
    cmd = `${options.prefix ? options.prefix + ' && ' : ''}${bin} ${options.args}`;
  } else {
    cmd = bin;
  }

  log.verbose(`${_operationCounter}: ${cmd}`);

  let result;

  try {
    await retry({retries, interval}, async () => {
      if (statusLogs && statusLogs.trying) {
        log.info(`${_operationCounter}: ${statusLogs.trying}`);
      }
      result = await exec(cmd);
    });
  } catch (err) {
    log.error(`${_operationCounter}: running "${cmd}" returned ${err.code}`);
    log.error(`${_operationCounter}: stderr: ${err.stderr}`);
  }

  if (result === undefined) {
    throw new Error(`${_operationCounter}: running "${cmd}" returned undefined`);
  }

  if (result.stdout) {
    log.verbose(`${_operationCounter}: stdout: ${result.stdout}`);
  }

  if (statusLogs && statusLogs.successful) {
    log.info(`${_operationCounter}: ${statusLogs.successful}`);
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

function spawnAndLog(command, flags) {
  let out = '';
  let err = '';
  const result = spawn(command, flags, {stdio: ['ignore', 'pipe', 'pipe'], detached: true});

  log.verbose(`${command} ${flags.join(' ')}`);

  if (result.childProcess) {
    const {stdout, stderr} = result.childProcess;

    stdout.on('data', (chunk) => out += chunk.toString());
    stderr.on('data', (chunk) => err += chunk.toString());

    stdout.on('end', () => out && log.verbose('stdout:', out));
    stderr.on('end', () => err && log.verbose('stderr:', err));
  }

  return result;
}

module.exports = {
  execWithRetriesAndLogs,
  spawnAndLog
};

