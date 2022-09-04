const util = require('util');

const callsites = require('../../utils/callsites');

const USER_STACK_FRAME_INDEX = 2;

function override(console, method, bunyanLoggerFn) {
  if (method === 'trace') {
    console.trace = proxyTracing(bunyanLoggerFn);
  } else if (method === 'assert') {
    console.assert = proxyAssert(bunyanLoggerFn);
  } else {
    console[method] = proxyLog(bunyanLoggerFn);
  }
}

function getOrigin() {
  const userCallSite = callsites.getCallSites()[USER_STACK_FRAME_INDEX];
  return callsites.getOrigin(userCallSite);
}

function getStackDump() {
  return callsites.getStackDump(USER_STACK_FRAME_INDEX);
}

function proxyLog(bunyanLoggerFn) {
  return (...args) => {
    bunyanLoggerFn({ origin: getOrigin() }, util.format(...args));
  };
}

function proxyTracing(bunyanLoggerFn) {
  return (...args) => {
    bunyanLoggerFn({ origin: getOrigin(), stack: getStackDump() }, util.format(...args));
  };
}

function proxyAssert(bunyanLoggerFn) {
  return (condition, ...args) => {
    if (!condition) {
      bunyanLoggerFn({ origin: getOrigin() }, 'AssertionError:', util.format(...args));
    }
  };
}

function overrideConsoleMethods(console, bunyanLogger) {
  if (!console.__detox_log__) {
    const log = bunyanLogger;

    override(console, 'log', log.info.bind(log));
    override(console, 'warn', log.warn.bind(log));
    override(console, 'trace', log.info.bind(log));
    override(console, 'error', log.error.bind(log));
    override(console, 'debug', log.debug.bind(log));
    override(console, 'assert', log.error.bind(log));

    console.__detox_log__ = log;
  }

  return console;
}

module.exports = {
  overrideConsoleMethods,
};
