const { isError } = require('lodash');

function removeInternalStackEntries(error) {
  const lines = error.stack.split('\n');

  const filtered = lines.filter(rawLine => {
    const line = rawLine.trim();

    if (line.startsWith('at ') && line.includes('/detox/src')) {
      return false;
    }

    return true;
  });

  error.stack = filtered.join('\n');
  return error;
}

function asError(error) {
  return isError(error) ? error : new Error(error);
}

module.exports = {
  removeInternalStackEntries,
  asError,
};
