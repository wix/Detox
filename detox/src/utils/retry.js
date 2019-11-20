const sleep = require('./sleep');

const DEFAULT_RETRIES = 9;
const DEFAULT_INTERVAL = 500;
const DEFAULT_CONDITION_FN = () => true;

async function retry(options, func) {
  if (typeof options === 'function') {
    func = options;
    options = {};
  }

  const {
    retries = DEFAULT_RETRIES,
    interval = DEFAULT_INTERVAL,
    conditionFn = DEFAULT_CONDITION_FN,
  } = options;

  for (let totalRetries = 1; true; totalRetries++) {
    try {
      return await func(totalRetries);
    } catch (e) {
      if (!conditionFn(e) || (totalRetries > retries)) {
        throw e;
      }
      await sleep(totalRetries * interval);
    }
  }
}

module.exports = retry;
