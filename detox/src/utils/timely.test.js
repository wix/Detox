const timely = require('./timely');

describe('timely', () => {
  it('should wrap async functions with a timeout error (happy path)', async () => {
    const fortyTwo = async () => 42;
    const fortyTwoTimed = timely(fortyTwo, 1000, new Error());

    await expect(fortyTwoTimed()).resolves.toBe(42);
  });

  it('should wrap async functions with a timeout error (unhappy path)', async () => {
    const infinitely = () => new Promise(() => {});
    const infinitelyTimed = timely(infinitely, 0, new Error('No One Lives Forever'));

    await expect(infinitelyTimed()).rejects.toThrow('No One Lives Forever');
  });

  it('should wrap sync functions as a fallback too', async () => {
    const syncTimely = timely(() => 42, 1000, new Error());

    await expect(syncTimely()).resolves.toBe(42);
  });
});
