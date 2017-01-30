const DEFAULT_RETRIES = 10;
const DEFAULT_INTERVAL = 500;

async function retry(options, func) {
  if (typeof options === 'function') {
    func = options;
    options = {};
  }

  let {retries, interval} = options;
  retries = retries || DEFAULT_RETRIES;
  interval = interval || DEFAULT_INTERVAL;

  let currentRetry = 0;
  while (currentRetry++ < retries) {
    try {
      return await func(currentRetry);
    } catch (e) {
      if (currentRetry === retries) {
        throw e;
      } else {
        const sleep = currentRetry * interval;
        await new Promise((accept) => setTimeout(accept, sleep));
      }
    }
  }
}

module.exports = retry;
