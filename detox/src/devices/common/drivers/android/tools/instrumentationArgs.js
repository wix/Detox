const _ = require('lodash');

const { encodeBase64 } = require('../../../../../utils/encoding');

const reservedInstrumentationArgs = ['class', 'package', 'func', 'unit', 'size', 'perf', 'debug', 'log', 'emma', 'coverageFile'];
const isReservedInstrumentationArg = (arg) => reservedInstrumentationArgs.includes(arg);

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

    result.push('-e', key, valueEncoded);
    return result;
  }, []);

  return {
    args: preparedLaunchArgs,
    usedReservedArgs,
  };
}

module.exports = {
  prepareInstrumentationArgs,
};
