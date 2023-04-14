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
    bunyanLoggerFn({ cat: 'user', origin: getOrigin() }, util.format(...args));
  };
}

function proxyTracing(bunyanLoggerFn) {
  return (...args) => {
    bunyanLoggerFn({ cat: 'user', origin: getOrigin(), stack: getStackDump() }, util.format(...args));
  };
}

function proxyAssert(bunyanLoggerFn) {
  return (condition, ...args) => {
    if (!condition) {
      bunyanLoggerFn({ cat: 'user', origin: getOrigin() }, 'AssertionError:', util.format(...args));
    }
  };
}

function overrideConsoleMethods(console, bunyanLogger) {
  if (!console.__detox_log__) {
    const log = bunyanLogger;

    console.__detox_log__ = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      trace: console.trace,
      error: console.error,
      debug: console.debug,
      assert: console.assert,
    };

    override(console, 'log', log.info.bind(log));
    override(console, 'info', log.info.bind(log));
    override(console, 'warn', log.warn.bind(log));
    override(console, 'trace', log.info.bind(log));
    override(console, 'error', log.error.bind(log));
    override(console, 'debug', log.debug.bind(log));
    override(console, 'assert', log.error.bind(log));
  }

  return console;
}

function restoreConsoleMethods(console) {
  if (console.__detox_log__) {
    Object.assign(console, console.__detox_log__);
    delete console.__detox_log__;
  }
}

module.exports = {
  overrideConsoleMethods,
  restoreConsoleMethods,
};
