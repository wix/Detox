const _ = require('lodash');

const { encodeBase64 } = require('../../../../../utils/encoding');
const { autoEscape } = require('../../../../../utils/shellUtils');

const reservedInstrumentationArgs = new Set(['class', 'package', 'func', 'unit', 'size', 'perf', 'debug', 'log', 'emma', 'coverageFile']);
const isReservedInstrumentationArg = (arg) => reservedInstrumentationArgs.has(arg);

function prepareInstrumentationArgs(args) {
  const usedReservedArgs = [];
  const preparedLaunchArgs = _.reduce(args, (result, value, key) => {
    const valueAsString = _.isString(value) ? value : JSON.stringify(value);

    let valueEncoded = valueAsString;
    if (isReservedInstrumentationArg(key)) {
      usedReservedArgs.push(key);
    } else if (!key.startsWith('detox')) {
      valueEncoded = encodeBase64(valueAsString);
    }

    const valueEscaped = hasLegacyIssues(key) ? valueEncoded : autoEscape.shell(valueEncoded);
    result.push('-e', key, valueEscaped);
    return result;
  }, []);

  return {
    args: preparedLaunchArgs,
    usedReservedArgs,
  };
}

function hasLegacyIssues(key) {
  return key === 'detoxURLBlacklistRegex';
}

module.exports = {
  prepareInstrumentationArgs,
};
