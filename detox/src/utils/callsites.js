const path = require('path');
const {escapeRegExp} = require('lodash');
const cwd = process.cwd() + path.sep;

// Taken from https://github.com/sindresorhus/callsites
function getCallSites() {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack.slice(1);
  Error.prepareStackTrace = _prepareStackTrace;
  return stack;
}

function getStackDump(endFrame = 0) {
  return new Error().stack
    .split('\n')
    .slice(2 + endFrame) // 2 = 1 for 'Error:' prefix and 1 for this function's frame
    .join('\n')
    .replace(new RegExp(escapeRegExp(cwd), 'g'), '');
}

function getOrigin(callSite) {
  const callsiteFilename = callSite && callSite.getFileName();
  const callsiteLine = callSite && callSite.getLineNumber();
  const callsiteCol = callSite && callSite.getColumnNumber();
  const filename = callsiteFilename ? path.relative(process.cwd(), callsiteFilename) : '<unknown>';
  return `at ${filename}:${callsiteLine || '?'}:${callsiteCol || '?'}`;
}

module.exports = {
  getCallSites,
  getOrigin,
  getStackDump,
};
