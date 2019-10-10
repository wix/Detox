const safeAsync = require('./safeAsync');

describe('safeAsync', () => {
  it(`should wrap value into a promise`, async() => {
    await expect(safeAsync(5)).resolves.toEqual(5);
  });

  it(`should call sync function and return its result as a promise`, async() => {
    await expect(safeAsync(() => 5)).resolves.toEqual(5);
  });

  it(`should call async function into a promise`, async() => {
    await expect(safeAsync(async () => 5)).resolves.toEqual(5);
  });

  it(`should handle sync function errors in the async way`, async() => {
    await expect(safeAsync( () => { throw 'error'; })).rejects.toEqual('error');
  });
});
