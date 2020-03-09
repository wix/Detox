const fs = require('fs-extra');
const path = require('path');
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const argparse = require('./argparse');
const temporaryPath = require('../artifacts/utils/temporaryPath');
const customConsoleLogger = require('./customConsoleLogger');

function adaptLogLevelName(level) {
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

    default:
      return 'info';
  }
}

function overrideConsoleLogger(logger) {
  const log = logger.child({component: 'USER_LOG'});
  customConsoleLogger.overrideAllLevels(log);
}

function createPlainBunyanStream({ logPath, level }) {
  const options = {
    showDate: false,
    showLoggerName: true,
    showPid: true,
    showMetadata: false,
    basepath: __dirname,
    out: process.stderr,
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
  const level = adaptLogLevelName(levelFromArg);
  const bunyanStreams = [createPlainBunyanStream({ level })];

  let jsonFileStreamPath, plainFileStreamPath;
  if (!global.DETOX_CLI && !global.IS_RUNNING_DETOX_UNIT_TESTS) {
    {
      jsonFileStreamPath = temporaryPath.for.log();
      fs.ensureFileSync(jsonFileStreamPath);
      bunyanStreams.push({
        level,
        path: jsonFileStreamPath,
      });
    }
    {
      plainFileStreamPath = temporaryPath.for.log();
      fs.ensureFileSync(plainFileStreamPath);
      bunyanStreams.push(createPlainBunyanStream({
        level,
        logPath: plainFileStreamPath,
      }));
    }
  }

  const logger = bunyan.createLogger({
    name: 'detox',
    streams: bunyanStreams,
  });

  if (jsonFileStreamPath) {
    logger.jsonFileStreamPath = jsonFileStreamPath;
  }

  if (plainFileStreamPath) {
    logger.plainFileStreamPath = plainFileStreamPath;
  }

  if (argparse.getArgValue('use-custom-logger') === 'true') {
    overrideConsoleLogger(logger);
  }

  return logger;
}

module.exports = init();
