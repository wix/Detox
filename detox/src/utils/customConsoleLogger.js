const util = require('util');
const path = require('path');
const callsites = require('./callsites');

const USER_STACK_FRAME_INDEX = 2;
const CONSOLE_ASSERT_USER_ARGS_INDEX = 1;
const EVENT_NAME = 'USER_LOG';
const bunyanFields = {
  event: EVENT_NAME
};

function getStackDump() {
  return callsites.stackdump(USER_STACK_FRAME_INDEX);
}

function getOrigin() {
  const userCallsite = callsites()[USER_STACK_FRAME_INDEX];
  const filename = path.relative(process.cwd(), userCallsite.getFileName());
  return `at ${filename}:${userCallsite.getLineNumber() || '?'}:${userCallsite.getColumnNumber() || '?'}`;
}

function override(consoleLevel, bunyanFn) {
  console[consoleLevel] = (...args) => {
    bunyanFn(bunyanFields, getOrigin(), '\n', util.format(...args));
  };
}

function overrideTrace(consoleLevel, bunyanFn) {
  console[consoleLevel] = (...args) => {
    bunyanFn(bunyanFields, getOrigin(), '\n  Trace:', util.format(...args), '\n\r' + getStackDump());
  };
}

function overrideAssertion(consoleLevel, bunyanFn) {
  console[consoleLevel] = (...args) => {
    const [condition] = args;
    if (!condition) {
      bunyanFn(bunyanFields, getOrigin(), '\n  AssertionError:', util.format(...args.slice(CONSOLE_ASSERT_USER_ARGS_INDEX)));
    }
  };
}

function overrideAllLevels(bunyanLogger) {
  const log = bunyanLogger;
  override('debug', log.debug.bind(log));
  override('log', log.info.bind(log));
  override('warn', log.warn.bind(log));
  override('error', log.error.bind(log));
  overrideTrace('trace', log.info.bind(log));
  overrideAssertion('assert', log.error.bind(log));
}

module.exports = {
  override,
  overrideTrace,
  overrideAssertion,
  overrideAllLevels,
};
