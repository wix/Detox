const _ = require('lodash');
const lifecycleSymbols = require('../../integration').lifecycle;

function wrapErrorWithNoopLifecycle(rawError) {
  const error = _.isError(rawError) ? rawError : new Error(rawError);
  for (const symbol of Object.values(lifecycleSymbols)) {
    error[symbol] = _.noop;
  }

  return error;
}

module.exports = wrapErrorWithNoopLifecycle;
