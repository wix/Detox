const DEFAULT_RETRIES = 10;
const DEFAULT_INTERVAL = 500;

async function retry(options, func) {
  if (typeof options === 'function') {
    func = options;
    options = {};
  }

  const start = Date.now();
  let {retries, interval } = options;
  retries = retries || DEFAULT_RETRIES;
  interval = interval || DEFAULT_INTERVAL;

  let currentRetry = 0;
  while (currentRetry++ < retries) {
    try {
      return await func(currentRetry);
    } catch (e) {
      const sleep = currentRetry * interval;
      // wait for a bit before retrying...
      await new Promise((accept) => setTimeout(accept, sleep));
    }
  }

  throw new Error(`
    Failed to resolve promise after ${retries} over ${Date.now() - start} ms
  `);
}

module.exports = retry;
