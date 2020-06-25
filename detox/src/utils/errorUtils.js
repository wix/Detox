const S = require('path').sep;
const { isError } = require('lodash');

const DETOX_SRC_PATH =  `${S}detox${S}src`;

function removeInternalStackEntries(error) {
  const lines = error.stack.split('\n');

  const filtered = lines.filter(rawLine => {
    const line = rawLine.trim();

    if (line.startsWith('at ') && line.includes(DETOX_SRC_PATH)) {
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
