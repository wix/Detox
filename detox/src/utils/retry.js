const sleep = require('./sleep');

const DEFAULT_INITIAL_SLEEP = 0;
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
    initialSleep = DEFAULT_INITIAL_SLEEP,
    shouldUnref,
  } = options;

  const backoffFn = backoffModes[backoff]();
  const sleepOptions = shouldUnref ? { shouldUnref } : undefined;

  if (initialSleep) {
    await sleep(initialSleep, sleepOptions);
  }

  // eslint-disable-next-line no-constant-condition
  for (let totalTries = 1, lastError = null; true; totalTries++) {
    try {
      return await func(totalTries, lastError);
    } catch (e) {
      lastError = e;

      if (!conditionFn(e) || (totalTries > retries)) {
        throw e;
      }
      await sleep(backoffFn({ interval, totalTries }), sleepOptions);
    }
  }
}

module.exports = retry;
