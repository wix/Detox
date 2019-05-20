describe('Delegated-promise util', () => {
  let fallbackTimeout;

  let promise;
  beforeEach(() => {
    const delegatedPromise = require('./delegatedPromise');
    promise = delegatedPromise();

    fallbackTimeout = setTimeout(() => {
      expect(false).toEqual(true);
    }, 10);
  });

  afterEach(() => {
    clearTimeout(fallbackTimeout);
  });

  it('should provide a working resolve() method', async () => {
    let resolved = false;

    setTimeout(() => {
      promise.resolve();
      resolved = true;
    }, 1);

    expect(resolved).toEqual(false);
    await promise;
    expect(resolved).toEqual(true);
  });

  it('should provide a working reject() method', async () => {
    const error = new Error('Test error');

    let rejected = false;

    setTimeout(() => promise.reject(error), 1);

    expect(rejected).toEqual(false);

    try {
      await promise;
    } catch (e) {
      rejected = true;
      expect(e).toEqual(error);
    }
    expect(rejected).toEqual(true);
  });
});
