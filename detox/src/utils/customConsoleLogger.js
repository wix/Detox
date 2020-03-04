const util = require('util');
const path = require('path');
const callsites = require('callsites');

function callsitesToStack() {
  return callsites().slice(2).reduce((result, callsite) => {
    const filename = callsite.getFileName() ? path.relative(process.cwd(), callsite.getFileName()) : '';
    const filePointer = filename ? `${filename}:${callsite.getLineNumber() || '?'}:${callsite.getColumnNumber() || '?'}` : '<unknown>';
    return result.concat(`\r    at ${callsite.getFunctionName()} (${filePointer})\n`)
  }, '');
}

function getOrigin() {
  const callsite = callsites()[2];
  const filename = path.relative(process.cwd(), callsite.getFileName());
  return `at ${filename}:${callsite.getLineNumber() || '?'}:${callsite.getColumnNumber() || '?'}`;
}

function override(consoleLevel, bunyanFn) {
  console[consoleLevel] = (...args) => {
    bunyanFn({ event: 'USER_LOG' }, getOrigin(), '\n', util.format(...args));
  };
}

function overrideTrace(consoleLevel, bunyanFn) {
  console[consoleLevel] = (...args) => {
    bunyanFn({ event: 'USER_LOG' }, getOrigin(), '\n  Trace:', util.format(...args), '\n', callsitesToStack());
  };
}

function overrideAssertion(consoleLevel, bunyanFn) {
  console[consoleLevel] = (...args) => {
    bunyanFn({ event: 'USER_LOG' }, getOrigin(), '\n  AssertionError:', util.format(...args.slice(1)));
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
  overrideAssertion,
  overrideAllLevels,
};
