const sleep = require('./sleep');

describe(sleep.name, () => {
  it('should sleep for given [ms] time', async () => {
    const t = Date.now();
    await sleep(50);
    expect(Date.now() - t).toBeGreaterThan(20);
  });
});

