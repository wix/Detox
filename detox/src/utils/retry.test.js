describe('retry', () => {
  let retry;

  beforeEach(() => {
    retry = require('./retry');
  });

  it(`a promise that rejects two times and then resolves, with default params`, async () => {
    const mockFn = jest.fn()
                       .mockReturnValueOnce(Promise.reject())
                       .mockReturnValueOnce(Promise.resolve());
    await retry(mockFn);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it(`a promise that rejects two times and then resolves, with custom params`, async () => {
    const mockFn = jest.fn()
                       .mockReturnValueOnce(Promise.reject())
                       .mockReturnValueOnce(Promise.resolve());
    await retry({retries: 2, interval: 1}, mockFn);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it(`a promise that rejects two times, with two retries`, async () => {
    const mockFn = jest.fn()
                       .mockReturnValueOnce(Promise.reject('a thing'))
                       .mockReturnValueOnce(Promise.reject('a thing'));
    try {
      await retry({retries: 2, interval: 1}, mockFn);
      fail('expected retry to fail to throw');
    } catch (object) {
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(object).toBeDefined();
    }
  });
});
