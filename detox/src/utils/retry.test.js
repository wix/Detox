describe('retry', () => {
  let sleep;
  let retry;

  const mockFailingUserFn = () => jest.fn().mockReturnValue(Promise.reject(new Error('a thing')));
  const mockFailingOnceUserFn = () => jest.fn()
    .mockRejectedValueOnce(new Error('once'))
    .mockReturnValueOnce();
  const mockFailingTwiceUserFn = () => jest.fn()
    .mockRejectedValueOnce(new Error('once'))
    .mockRejectedValueOnce(new Error('twice'))
    .mockReturnValueOnce();

  beforeEach(() => {
    jest.mock('./sleep', () => jest.fn().mockReturnValue(Promise.resolve()));
    sleep = require('./sleep');

    retry = require('./retry');
  });

  it('should retry once over a function that fails once', async () => {
    const mockFn = mockFailingOnceUserFn();

    await expect(retry({ retries: 999, interval: 0 }, mockFn)).resolves.not.toThrow();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should sleep before calling a function if initialSleep is set', async () => {
    const mockFn = jest.fn();

    await expect(retry({ initialSleep: 1234, retries: 999, interval: 0 }, mockFn)).resolves.not.toThrow();

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(1234, undefined);
  });

  it('should call sleep() with { shouldUnref: true } if set', async () => {
    const mockFn = mockFailingTwiceUserFn();

    await expect(retry({ initialSleep: 1000, retries: 2, interval: 0, shouldUnref: true, }, mockFn)).resolves.not.toThrow();

    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(1000, { shouldUnref: true });
    expect(sleep).toHaveBeenCalledWith(0, { shouldUnref: true });
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
    await expect(retry({ retries: 2, interval: 1 }, mockFn)).rejects.toThrowError();
  });

  it('should adhere to interval parameter, and sleep for increasingly long intervals (i.e. the default backoff mode)', async () => {
    const mockFn = mockFailingUserFn();
    const baseInterval = 111;

    await expect(retry({ retries: 2, interval: baseInterval }, mockFn)).rejects.toThrowError();

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(baseInterval, undefined);
    expect(sleep).toHaveBeenCalledWith(baseInterval * 2, undefined);
  });

  it('should allow for a constant sleep interval instead of an increasing one by setting backoff="none"', async () => {
    const mockFn = mockFailingUserFn();
    const baseInterval = 111;
    const options = {
      retries: 2,
      interval: baseInterval,
      backoff: 'none',
    };

    await expect(retry(options, mockFn)).rejects.toThrow();

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, baseInterval, undefined);
    expect(sleep).toHaveBeenNthCalledWith(2, baseInterval, undefined);
  });

  it('should allow for the default linear backoff when set explicitly as "linear"', async () => {
    const mockFn = mockFailingUserFn();
    const baseInterval = 111;
    const options = {
      retries: 2,
      interval: baseInterval,
      backoff: 'linear',
    };

    await expect(retry(options, mockFn)).rejects.toThrow();

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(baseInterval, undefined);
    expect(sleep).toHaveBeenCalledWith(baseInterval * 2, undefined);
  });

  it('should adhere to a custom condition', async () => {
    const mockFn = mockFailingUserFn();
    const conditionFn = jest.fn()
                            .mockReturnValueOnce(true)
                            .mockReturnValueOnce(false);

    await expect(retry({ retries: 999, interval: 1, conditionFn }, mockFn)).rejects.toThrowError();

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should work with default retries+interval values', async () => {
    const mockFn = mockFailingUserFn();
    const defaultRetries = 9;
    const defaultInterval = 500;

    await expect(retry(mockFn)).rejects.toThrowError();

    expect(mockFn).toHaveBeenCalledTimes(defaultRetries + 1);
    expect(sleep).toHaveBeenCalledWith(defaultInterval, undefined);
  });
});
