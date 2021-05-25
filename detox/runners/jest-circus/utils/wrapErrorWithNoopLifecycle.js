const _ = require('lodash');

const lifecycleSymbols = require('../../integration').lifecycle;

function wrapErrorWithNoopLifecycle(error) {
  const wrapper = { error };
  for (const symbol of Object.values(lifecycleSymbols)) {
    wrapper[symbol] = _.noop;
  }

  return wrapper;
}

module.exports = wrapErrorWithNoopLifecycle;
