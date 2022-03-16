const fs = require('fs-extra');
const onExit = require('signal-exit');
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

function tryOverrideConsole(logger, global) {
  if (argparse.getArgValue('use-custom-logger') === 'true') {
    const userLogger = logger.child({ component: 'USER_LOG' });
    customConsoleLogger.overrideConsoleMethods(global.console, userLogger);
  }
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
        if (entry.event === 'USER_LOG') {
          return '';
        }

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
        level: 'trace',
        path: jsonFileStreamPath,
      });
    }
    {
      plainFileStreamPath = temporaryPath.for.log();
      fs.ensureFileSync(plainFileStreamPath);
      bunyanStreams.push(createPlainBunyanStream({
        level: 'trace',
        logPath: plainFileStreamPath,
      }));
    }

    onExit(() => {
      try { fs.unlinkSync(jsonFileStreamPath); } catch (e) {}
      try { fs.unlinkSync(plainFileStreamPath); } catch (e) {}
    });
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

  tryOverrideConsole(logger, global);

  logger.getDetoxLevel = () => level;

  logger.reinitialize = (global) => {
    if (jsonFileStreamPath) {
      fs.ensureFileSync(jsonFileStreamPath);
    }

    if (plainFileStreamPath) {
      fs.ensureFileSync(plainFileStreamPath);
    }

    tryOverrideConsole(logger, global);
  };

  return logger;
}

module.exports = init();
