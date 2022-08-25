// @ts-nocheck
const { spawn } = require('child-process-promise');
const _ = require('lodash');

const rootLogger = require('../logger').child({ __filename, cat: 'child-process,child-process-spawn' });
const { escape } = require('../pipeCommands');
const retry = require('../retry');

const execsCounter = require('./opsCounter');

function spawnAndLog(binary, flags, options) {
  const command = _joinCommandAndFlags(binary, flags);
  const logger = rootLogger.child({ id: execsCounter.inc() });
  return _spawnAndLog(logger, binary, flags, command, options);
}

async function spawnWithRetriesAndLogs(binary, flags, options = {}) {
  const command = _joinCommandAndFlags(binary, flags);
  const logger = rootLogger.child({ id: execsCounter.inc() });
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
  await retry({ retries, interval }, async (tryCount) => {
    if (tryCount > 1) {
      logger.trace(`retrying #${tryCount}`);
    }

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
  const log = rootLogger.child({ cpid });

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

function _spawnAndLog(logger, binary, flags, command, options, tryCount = 1) {
  const { logLevelPatterns, silent, ...spawnOptions } = { stdio: ['ignore', 'pipe', 'pipe'], ...options };
  const traceHandle = logger.trace.begin({ tryCount }, command);
  const cpPromise = spawn(binary, flags, spawnOptions);

  const { childProcess } = cpPromise;
  const { exitCode, stdout, stderr, pid: cpid } = childProcess;

  if (exitCode != null && exitCode !== 0) {
    traceHandle.end({ exitCode, cpid });
  }

  if (!silent) {
    stdout && stdout.on('data', _spawnStdoutLoggerFn(logger, logLevelPatterns));
    stderr && stderr.on('data', _spawnStderrLoggerFn(logger, logLevelPatterns));
  }

  function onEnd(resultOrErr) {
    const signal = resultOrErr.childProcess.signalCode || '';
    const { code: exitCode } = resultOrErr;

    traceHandle.end({ exitCode, signal });
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
  log[loglevel]({ stdout: true, cat: 'child-process,child-process-output' }, line);
};

const _spawnStderrLoggerFn = (log, logLevelPatterns) => (chunk) => {
  const line = chunk.toString();
  const loglevel = _inferLogLevel(line, logLevelPatterns) || 'error';
  log[loglevel]({ stderr: true, cat: 'child-process,child-process-output' }, line);
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

module.exports = {
  spawnAndLog,
  spawnWithRetriesAndLogs,
  interruptProcess,
};
