const DEFAULT_RETRIES = 10;
const DEFAULT_INTERVAL = 500;

async function retry(options, func) {
	let opts = options;
	let fun = func;
	if (typeof options === "function") {
		fun = options;
		opts = {};
	}

	let { retries, interval } = opts;
	retries = retries || DEFAULT_RETRIES;
	interval = interval || DEFAULT_INTERVAL;

	let currentRetry = 0;
	while (currentRetry++ < retries) {
		try {
			return await fun(currentRetry);
		} catch (e) {
			if (currentRetry === retries) {
				throw e;
			} else {
				const sleep = currentRetry * interval;
				await new Promise(resolve => setTimeout(resolve, sleep));
			}
		}
	}
}

module.exports = retry;
