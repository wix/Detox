const sleep = require('./sleep');

const DEFAULT_RETRIES = 9;
const DEFAULT_INTERVAL = 500;
const DEFAULT_CONDITION_FN = () => true;
const DEFAULT_BACKOFF_MODE = 'linear';
const backoffModes = {
  'linear': () => ({ interval, totalTries }) => totalTries * interval,
  'none': () => ({ interval }) => interval,
};

async function retry(optionsOrFunc, func) {
  let options = optionsOrFunc;
  if (typeof optionsOrFunc === 'function') {
    func = optionsOrFunc;
    options = {};
  }

  const {
    retries = DEFAULT_RETRIES,
    interval = DEFAULT_INTERVAL,
    backoff = DEFAULT_BACKOFF_MODE,
    conditionFn = DEFAULT_CONDITION_FN,
  } = options;

  const backoffFn = backoffModes[backoff]();

  for (let totalTries = 1, lastError = null; true; totalTries++) {
    try {
      return await func(totalTries, lastError);
    } catch (e) {
      lastError = e;

      if (!conditionFn(e) || (totalTries > retries)) {
        throw e;
      }
      await sleep(backoffFn({ interval, totalTries }));
    }
  }
}

module.exports = retry;
