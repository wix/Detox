const jestExpect = require('expect').default;


async function waitForCondition (func, condition, timeout = 5000) {
  let isFulfilled = false;

  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (condition(await func())) {
      isFulfilled = true;
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  jestExpect(isFulfilled).toBe(true);
}

module.exports = {
  waitForCondition
};
