// @ts-nocheck

const path = require('path');

const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const fs = require('fs-extra');
const onExit = require('signal-exit');

const temporaryPath = require('../artifacts/utils/temporaryPath');

const argparse = require('./argparse');
const customConsoleLogger = require('./customConsoleLogger');
const { shortFormat: shortDateFormat } = require('./dateUtils');

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

function createPlainBunyanStream({ logPath, level, showDate = true }) {
  const options = {
    showDate: showDate,
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

        if (entry.event === 'ERROR') {
          return `${filename}/${entry.event}`;
        }

        return entry.event ? entry.event : filename;
      },
      'trackingId': id => ` #${id}`,
      'cpid': pid => ` cpid=${pid}`,
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

/**
 * @returns {Logger}
 */
function init() {
  const levelFromArg = argparse.getArgValue('loglevel', 'l');
  const level = adaptLogLevelName(levelFromArg);
  const debugStream = createPlainBunyanStream({ level, showDate: shortDateFormat });
  const bunyanStreams = [debugStream];

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

  const originalChild = logger.child.bind(logger);

  logger.child = (options) => {
    if (options && options.__filename) {
      return originalChild({
        ...options,
        __filename: path.basename(options.__filename)
      });
    }

    return originalChild(options);
  };

  return logger;
}

module.exports = init();
