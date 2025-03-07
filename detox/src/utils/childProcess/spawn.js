// @ts-nocheck
const _ = require('lodash');
const { spawn } = require('promisify-child-process');

const rootLogger = require('../logger').child({ cat: ['child-process', 'child-process-spawn'] });
const { escape } = require('../pipeCommands');
const retry = require('../retry');

const execsCounter = require('./opsCounter');

function spawnAndLog(binary, args, options) {
  const command = _joinCommandAndArgs(binary, args);
  const trackingId = execsCounter.inc();
  const logger = rootLogger.child({ fn: 'spawnAndLog', command, trackingId });
  return _spawnAndLog(logger, binary, args, command, options);
}

async function spawnWithRetriesAndLogs(binary, args, options = {}) {
  const command = _joinCommandAndArgs(binary, args);
  const trackingId = execsCounter.inc();
  const logger = rootLogger.child({ fn: 'spawnWithRetriesAndLogs', command, trackingId });
  const _options = {
    ...options,
    capture: _.union(options.capture || [], ['stderr']),
  };
  const {
    retries = 1,
    interval = 100,
    backoff = 'none',
    ...spawnOptions
  } = _options;

  let result;
  await retry({ retries, interval, backoff }, async (tryCount, lastError) => {
    _logSpawnRetrying(logger, tryCount, lastError);
    result = _spawnAndLog(logger, binary, args, command, spawnOptions, tryCount);
    await result;
  });
  return result;
}

const DEFAULT_KILL_SCHEDULE = {
  SIGINT: 0,
};

async function interruptProcess(childProcessPromise, schedule) {
  const childProcess = childProcessPromise.childProcess;
  const cpid = childProcess.pid;
  const spawnargs = childProcess.spawnargs.join(' ');
  const log = rootLogger.child({ event: 'SPAWN_KILL', cpid });

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

function _spawnAndLog(logger, binary, args, command, options, tryCount) {
  const { logLevelPatterns, silent, ...spawnOptions } = { stdio: ['ignore', 'pipe', 'pipe'], ...options };
  const cpPromise = spawn(binary, args, spawnOptions);
  const childProcess = cpPromise.childProcess = cpPromise;
  const originalThen = cpPromise.then.bind(cpPromise);
  const augmentPromise = (fn) => {
    return typeof fn === 'function'
      ? (result) => fn(Object.assign(result, {
        childProcess,
        exitCode: childProcess.exitCode,
        pid: childProcess.pid
      }))
      : fn;
  };
  cpPromise.then = (onFulfilled, onRejected) => originalThen(augmentPromise(onFulfilled), augmentPromise(onRejected));
  cpPromise.catch = (onRejected) => cpPromise.then(undefined, onRejected);

  const { exitCode, stdout, stderr } = childProcess;

  const _logger = logger.child({ cpid: childProcess.pid });
  _logSpawnCommand(_logger, command, tryCount);

  if (exitCode != null && exitCode !== 0) {
    _logger.error({ event: 'SPAWN_ERROR' }, `${command} failed with code = ${exitCode}`);
  }

  if (!silent) {
    stdout && stdout.on('data', _spawnStdoutLoggerFn(_logger, logLevelPatterns));
    stderr && stderr.on('data', _spawnStderrLoggerFn(_logger, logLevelPatterns));
  }

  /**
   *
   * @param {import('promisify-child-process').Output} resultOrErr
   */
  function onEnd(resultOrErr) {
    const signal = resultOrErr.signal || '';
    const { code } = resultOrErr;
    const action = signal ? `terminated with ${signal}` : `exited with code #${code}`;

    _logger.debug({ event: 'SPAWN_END', signal, code }, `${command} ${action}`);
  }

  cpPromise.then(onEnd, onEnd);
  return cpPromise;
}

function _joinCommandAndArgs(command, args) {
  let result = command;

  for (const arg of args.map(String)) {
    result += ' ' + (arg.indexOf(' ') === -1 ? arg : `"${escape.inQuotedString(arg)}"`);
  }

  return result;
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

  const matchesRegex = (r) => r.test(msg);

  return _.findKey(patterns, (regexps) => {
    return regexps.some(matchesRegex);
  });
}

function _logSpawnRetrying(logger, tryCount, lastError) {
  if (tryCount > 1) {
    logger.trace({ event: 'SPAWN_TRY_FAIL' }, lastError.stderr);
  }
}

function _logSpawnCommand(logger, command, tryCount) {
  const message = (_.isNumber(tryCount) && tryCount > 1 ? `(Retry #${tryCount - 1}) ${command}` : command);
  logger.debug({ event: 'SPAWN_CMD' }, message);
}

module.exports = {
  spawnAndLog,
  spawnWithRetriesAndLogs,
  interruptProcess,
};
