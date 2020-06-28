const sleep = require('./sleep');

const DEFAULT_RETRIES = 9;
const DEFAULT_INTERVAL = 500;
const DEFAULT_CONDITION_FN = () => true;
const DEFAULT_BACKOFF_MODE = 'linear';
const backoffModes = {
  'linear': () => ({ interval, totalRetries }) => totalRetries * interval,
  'none': () => ({ interval }) => interval,
};

async function retry(options, func) {
  if (typeof options === 'function') {
    func = options;
    options = {};
  }

  const {
    retries = DEFAULT_RETRIES,
    interval = DEFAULT_INTERVAL,
    backoff = DEFAULT_BACKOFF_MODE,
    conditionFn = DEFAULT_CONDITION_FN,
  } = options;

  const backoffFn = backoffModes[backoff]();

  for (let totalRetries = 1; true; totalRetries++) {
    try {
      return await func(totalRetries);
    } catch (e) {
      if (!conditionFn(e) || (totalRetries > retries)) {
        throw e;
      }
      await sleep(backoffFn({ interval, totalRetries }));
    }
  }
}

module.exports = retry;
