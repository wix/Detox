describe('retry', () => {
  let sleep;
  let retry;

  const mockFailingUserFn = () => jest.fn().mockReturnValue(Promise.reject(new Error('a thing')));
  const mockFailingOnceUserFn = () => jest.fn()
    .mockReturnValueOnce(Promise.reject())
    .mockReturnValueOnce(Promise.resolve());
  const mockFailingTwiceUserFn = () => jest.fn()
    .mockReturnValueOnce(Promise.reject(new Error('once')))
    .mockReturnValueOnce(Promise.reject(new Error('twice')))
    .mockReturnValueOnce(Promise.resolve());

  beforeEach(() => {
    jest.mock('./sleep', () => jest.fn().mockReturnValue(Promise.resolve()));
    sleep = require('./sleep');

    retry = require('./retry');
  });

  it('should retry once over a function that fails once', async () => {
    const mockFn = mockFailingOnceUserFn();

    try {
      await retry({ retries: 999, interval: 0 }, mockFn);
    } catch (e) {
      fail('expected retry not to fail');
    }

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should sleep before calling a function if initialSleep is set', async () => {
    const mockFn = jest.fn();

    try {
      await retry({ initialSleep: 1234, retries: 999, interval: 0 }, mockFn);
    } catch (e) {
      fail('expected retry not to fail');
    }

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(1234);
  });

  it('should retry multiple times', async () => {
    const mockFn = mockFailingTwiceUserFn();
    await retry({ retries: 999, interval: 0 }, mockFn);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should provide error info in each failure', async () => {
    const mockFn = mockFailingTwiceUserFn();
    await retry({ retries: 999, interval: 0 }, mockFn);
    expect(mockFn).toHaveBeenCalledWith(1, null);
    expect(mockFn).toHaveBeenCalledWith(2, new Error('once'));
    expect(mockFn).toHaveBeenCalledWith(3, new Error('twice'));
  });

  it('should adhere to retries parameter', async () => {
    const mockFn = mockFailingUserFn();
    try {
      await retry({ retries: 2, interval: 1 }, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(error).toBeDefined();
    }
  });

  it('should adhere to interval parameter, and sleep for increasingly long intervals (i.e. the default backoff mode)', async () => {
    const mockFn = mockFailingUserFn();
    const baseInterval = 111;

    try {
      await retry({ retries: 2, interval: baseInterval }, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {}

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(baseInterval);
    expect(sleep).toHaveBeenCalledWith(baseInterval * 2);
  });

  it('should allow for a constant sleep interval instead of an increasing one by setting backoff="none"', async () => {
    const mockFn = mockFailingUserFn();
    const baseInterval = 111;
    const options = {
      retries: 2,
      interval: baseInterval,
      backoff: 'none',
    };

    try {
      await retry(options, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {}

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, baseInterval);
    expect(sleep).toHaveBeenNthCalledWith(2, baseInterval);
  });

  it('should allow for the default linear backoff when set explicitly as "linear"', async () => {
    const mockFn = mockFailingUserFn();
    const baseInterval = 111;
    const options = {
      retries: 2,
      interval: baseInterval,
      backoff: 'linear',
    };

    try {
      await retry(options, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {}

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(baseInterval);
    expect(sleep).toHaveBeenCalledWith(baseInterval * 2);
  });

  it('should adhere to a custom condition', async () => {
    const mockFn = mockFailingUserFn();
    const conditionFn = jest.fn()
                            .mockReturnValueOnce(true)
                            .mockReturnValueOnce(false);

    try {
      await retry({ retries: 999, interval: 1, conditionFn }, mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {}

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should work with default retries+interval values', async () => {
    const mockFn = mockFailingUserFn();
    const defaultRetries = 9;
    const defaultInterval = 500;

    try {
      await retry(mockFn);
      fail('expected retry to fail and throw');
    } catch (error) {}

    expect(mockFn).toHaveBeenCalledTimes(defaultRetries + 1);
    expect(sleep).toHaveBeenCalledWith(defaultInterval);
  });
});
