// @ts-nocheck
const { spawn } = require('child-process-promise');
const _ = require('lodash');

const rootLogger = require('../logger').child({ cat: ['child-process', 'child-process-spawn'] });
const { escape } = require('../pipeCommands');
const retry = require('../retry');

const execsCounter = require('./opsCounter');

function spawnAndLog(binary, flags, options) {
  const command = _joinCommandAndFlags(binary, flags);
  const trackingId = execsCounter.inc();
  const logger = rootLogger.child({ fn: 'spawnAndLog', command, trackingId });
  return _spawnAndLog(logger, binary, flags, command, options);
}

async function spawnWithRetriesAndLogs(binary, flags, options = {}) {
  const command = _joinCommandAndFlags(binary, flags);
  const trackingId = execsCounter.inc();
  const logger = rootLogger.child({ fn: 'spawnWithRetriesAndLogs', command, trackingId });
  const _options = {
    ...options,
    capture: _.union(options.capture || [], ['stderr']),
  };
  const {
    retries = 1,
    interval = 100,
    ...spawnOptions
  } = _options;

  let result;
  await retry({ retries, interval }, async (tryCount, lastError) => {
    _logSpawnRetrying(logger, tryCount, lastError);
    result = await _spawnAndLog(logger, binary, flags, command, spawnOptions, tryCount);
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

function _spawnAndLog(logger, binary, flags, command, options, tryCount) {
  const { logLevelPatterns, silent, ...spawnOptions } = { stdio: ['ignore', 'pipe', 'pipe'], ...options };
  const cpPromise = spawn(binary, flags, spawnOptions);

  const { childProcess } = cpPromise;
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

  function onEnd(resultOrErr) {
    const signal = resultOrErr.childProcess.signalCode || '';
    const { code } = resultOrErr;
    const action = signal ? `terminated with ${signal}` : `exited with code #${code}`;

    _logger.debug({ event: 'SPAWN_END', signal, code }, `${command} ${action}`);
  }

  cpPromise.then(onEnd, onEnd);
  return cpPromise;
}

function _joinCommandAndFlags(command, flags) {
  let result = command;

  for (const flag of flags.map(String)) {
    result += ' ' + (flag.indexOf(' ') === -1 ? flag : `"${escape.inQuotedString(flag)}"`);
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
