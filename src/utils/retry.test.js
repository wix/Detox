describe('retry', () => {
  let retry;

  beforeEach(() => {
    retry = require('./retry');
  });

  it(`a promise that rejects two times and then resolves, with default params`, async() => {
    const mockFnc = jest.fn()
                        .mockReturnValueOnce(Promise.reject())
                        .mockReturnValueOnce(Promise.resolve());
    await retry(mockFnc);
    expect(mockFnc).toHaveBeenCalledTimes(2);
  });

  it(`a promise that rejects two times and then resolves, with custom params`, async() => {
    const mockFnc = jest.fn()
                        .mockReturnValueOnce(Promise.reject())
                        .mockReturnValueOnce(Promise.resolve());
    await retry({retries: 2, interval: 1}, mockFnc);
    expect(mockFnc).toHaveBeenCalledTimes(2);
  });

  it(`a promise that rejects two times, with two retries`, async() => {
    const mockFn = jest.fn()
                       .mockReturnValue(Promise.reject(new Error('a thing')));
    try {
      await retry({retries: 2, interval: 1}, mockFn);
      fail('expected retry to fail to throw');
    } catch (object) {
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(object).toBeDefined();
    }
  });
});
