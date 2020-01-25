describe('retry', () => {
  let sleep;
  let retry;

  beforeEach(() => {
    jest.mock('./sleep', () => jest.fn().mockReturnValue(Promise.resolve()));
    sleep = require('./sleep');

    retry = require('./retry');
  });

  it('should retry once over a function that fails once', async () => {
    const mockFnc = jest.fn()
                        .mockReturnValueOnce(Promise.reject())
                        .mockReturnValueOnce(Promise.resolve());

    try {
      await retry({retries: 999, interval: 0}, mockFnc);
    } catch (e) {
      fail('expected retry not to fail');
    }

    expect(mockFnc).toHaveBeenCalledTimes(2);
  });

  it('should retry multiple times', async () => {
    const mockFnc = jest.fn()
                        .mockReturnValueOnce(Promise.reject('once'))
                        .mockReturnValueOnce(Promise.reject('twice'))
                        .mockReturnValueOnce(Promise.resolve());
    await retry({retries: 999, interval: 0}, mockFnc);
    expect(mockFnc).toHaveBeenCalledTimes(3);
  });

  it('should adhere to retries parameter', async () => {
    const mockFn = jest.fn()
                       .mockReturnValue(Promise.reject(new Error('a thing')));
    try {
      await retry({retries: 2, interval: 1}, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(error).toBeDefined();
    }
  });

  it('should adhere to interval parameter, and sleep for increasingly long intervals', async () => {
    const baseInterval = 111;
    const mockFn = jest.fn().mockReturnValue(Promise.reject(new Error('a thing')));

    try {
      await retry({retries: 2, interval: baseInterval}, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {
    }

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(baseInterval);
    expect(sleep).toHaveBeenCalledWith(baseInterval * 2);
  });

  it('should adhere to a custom condition', async () => {
    const mockFn = jest.fn()
                       .mockReturnValue(Promise.reject(new Error('a thing')));
    const conditionFn = jest.fn()
                            .mockReturnValueOnce(true)
                            .mockReturnValueOnce(false);

    try {
      await retry({retries: 999, interval: 1, conditionFn}, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {
    }

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should work with default retries+interval values', async () => {
    const defaultRetries = 9;
    const defaultInterval = 500;
    const mockFn = jest.fn().mockReturnValue(Promise.reject(new Error('a thing')));

    try {
      await retry(mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {
    }
    expect(mockFn).toHaveBeenCalledTimes(defaultRetries + 1);
    expect(sleep).toHaveBeenCalledWith(defaultInterval);
  });
});
