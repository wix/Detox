const _ = require('lodash');

const { encodeBase64 } = require('../../../../../utils/encoding');
const { autoEscape } = require('../../../../../utils/shellUtils');
const {
  isSerializedURLBlacklistForAndroid,
  serializeURLBlacklistForAndroid,
  URL_BLACKLIST_LAUNCH_ARG,
} = require('../../utils/urlBlacklist');

const reservedInstrumentationArgs = new Set(['class', 'package', 'func', 'unit', 'size', 'perf', 'debug', 'log', 'emma', 'coverageFile']);
const isReservedInstrumentationArg = (arg) => reservedInstrumentationArgs.has(arg);

function prepareInstrumentationArgs(args) {
  const usedReservedArgs = [];
  const preparedLaunchArgs = _.reduce(args, (result, value, key) => {
    const serializedValue = key === URL_BLACKLIST_LAUNCH_ARG ? serializeURLBlacklistForAndroid(value) : value;
    const valueAsString = _.isString(serializedValue) ? serializedValue : JSON.stringify(serializedValue);

    let valueEncoded = valueAsString;
    if (isReservedInstrumentationArg(key)) {
      usedReservedArgs.push(key);
    } else if (!key.startsWith('detox')) {
      valueEncoded = encodeBase64(valueAsString);
    }

    const valueEscaped = hasLegacyIssues(key, valueEncoded) ? valueEncoded : autoEscape.shell(valueEncoded);
    result.push('-e', key, valueEscaped);
    return result;
  }, []);

  return {
    args: preparedLaunchArgs,
    usedReservedArgs,
  };
}

function hasLegacyIssues(key, value) {
  return key === URL_BLACKLIST_LAUNCH_ARG && !isSerializedURLBlacklistForAndroid(value);
}

module.exports = {
  prepareInstrumentationArgs,
};
