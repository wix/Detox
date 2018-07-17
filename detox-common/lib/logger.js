const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const bunyan = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const argparse = require('./argparse');

function mapLogLevel(level) {
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

    case 'wss':
    case 'silly':
      return 'trace';

    default:
      return 'info';
  }
}

const level = mapLogLevel(argparse.getArgValue('loglevel'));
const logFilepath = path.join(argparse.getArgValue('artifacts-location') || '', 'detox.log');
const shouldRecordLogs = ['failing', 'all'].indexOf(argparse.getArgValue('record-logs')) >= 0;

const consoleStream = {
  level,
  type: 'raw',
  stream: bunyanDebugStream({
    showDate: false,
    showLoggerName: true,
    showPid: false,
    showMetadata: false,
    trimOutput: true,
    basepath: __dirname,
    prefixers: {
      '__filename': (filename, { entry }) => {
        const suffix = entry.event ? `/${entry.event}` : '';
        return path.basename(filename) + suffix;
      },
      'trackingId': id => ` #${id}`,
    },
  }),
  serializers: bunyanDebugStream.serializers,
};

const fileStream = shouldRecordLogs && logFilepath ? {
  level,
  path: logFilepath,
} : null;

if (fileStream) {
  fs.ensureFileSync(fileStream.path);
}

const streams = _.compact([consoleStream, fileStream]);

const detoxLogger = bunyan.createLogger({
  name: 'detox',
  streams
});

const detoxServerLogger = bunyan.createLogger({
  name: 'detox-server',
  streams
});

detoxLogger.server = detoxServerLogger;
module.exports = detoxLogger;
