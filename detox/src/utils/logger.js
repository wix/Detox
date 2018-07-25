const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const argparse = require('./argparse');

function adaptOlderLogLevelName(level) {
  switch (level) {
    case 'fatal':
    case 'error':
    case 'warn':
    case 'info':
    case 'debug':
    case 'trace':
      return level;

    case 'verbose':
      return 'debug';

    case 'silly':
    case 'wss':
      return 'trace';

    default:
      return 'info';
  }
}

function isLogLevelNameDeprecated(level) {
  switch (level) {
    case 'verbose':
    case 'silly':
    case 'wss':
      return true;
    default:
      return false;
  }
}

function createPlainBunyanStream({ logPath, level }) {
  const options = {
    showDate: false,
    showLoggerName: true,
    showPid: false,
    showMetadata: false,
    basepath: __dirname,
    prefixers: {
      '__filename': (filename, { entry }) => {
        const suffix = entry.event ? `/${entry.event}` : '';
        return path.basename(filename) + suffix;
      },
      'trackingId': id => ` #${id}`,
    },
  };

  if (logPath) {
    options.colors = false;
    options.out = fs.createWriteStream(logPath, {
      flags: 'a',
    });
  }

  if (argparse.getFlag('--no-color')) {
    options.colors = false;
  }

  return {
    level,
    type: 'raw',
    stream: bunyanDebugStream(options),
    serializers: bunyanDebugStream.serializers,
  };
}

function init() {
  const levelFromArg = argparse.getArgValue('loglevel');
  const level = adaptOlderLogLevelName(levelFromArg);
  const logBaseFilename = path.join(argparse.getArgValue('artifacts-location') || '', `detox_pid_${process.pid}`);
  const shouldRecordLogs = ['failing', 'all'].indexOf(argparse.getArgValue('record-logs')) >= 0;

  const bunyanStreams = [createPlainBunyanStream({ level })];
  if (shouldRecordLogs) {
    const jsonFileStreamPath = logBaseFilename + '.json.log';
    const plainFileStreamPath = logBaseFilename + '.log';

    fs.ensureFileSync(jsonFileStreamPath);
    fs.ensureFileSync(plainFileStreamPath);

    bunyanStreams.push({
      level,
      path: jsonFileStreamPath,
    });

    bunyanStreams.push(createPlainBunyanStream({
      level,
      logPath: plainFileStreamPath,
    }));
  }

  const logger = bunyan.createLogger({
    name: 'detox',
    streams: bunyanStreams,
  });

  if (isLogLevelNameDeprecated(levelFromArg)) {
    logger.warn(`--loglevel ${levelFromArg} is deprecated and will be removed in detox@9.0.0, use --loglevel ${level} instead`);
  }

  return logger;
}

module.exports = init();
