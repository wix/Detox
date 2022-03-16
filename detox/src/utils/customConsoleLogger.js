const util = require('util');

const callsites = require('./callsites');

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
    bunyanLoggerFn({ event: 'USER_LOG' }, getOrigin(), '\n', util.format(...args));
  };
}

function proxyTracing(bunyanLoggerFn) {
  return (...args) => {
    bunyanLoggerFn({ event: 'USER_LOG' }, getOrigin(), '\n  Trace:', util.format(...args), '\n\r' + getStackDump());
  };
}

function proxyAssert(bunyanLoggerFn) {
  return (condition, ...args) => {
    if (!condition) {
      bunyanLoggerFn({ event: 'USER_LOG' }, getOrigin(), '\n  AssertionError:', util.format(...args));
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
