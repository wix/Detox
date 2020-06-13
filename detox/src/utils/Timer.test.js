jest.useFakeTimers('modern');

describe('Timer', () => {
  let Timer;

  beforeEach(() => {
    Timer = require('./Timer');
  });

  it('should run action in time', async () => {
    const timer = new Timer({
      description: 'running test',
      timeout: 1000,
    });

    expect(await timer.run(() => 5)).toBe(5);
  });

  it('should throw if an action takes longer', async () => {
    const timer = new Timer({
      description: 'running this test',
      timeout: 999,
    });

    jest.advanceTimersByTime(1000);
    await expect(timer.run(() => {}))
      .rejects.toThrowError(/Exceeded timeout of 999ms while running this test/);
  });

  it('should throw if a sequence of actions takes longer', async () => {
    const timer = new Timer({
      description: 'running this test',
      timeout: 999,
    });

    for (let i = 0; i < 10; i++) {
      await timer.run(() => {});
      jest.advanceTimersByTime(100);
    }

    await expect(timer.run(() => {}))
      .rejects.toThrowError(/Exceeded timeout of 999ms while running this test/);
  });

  it('should be disposable', async () => {
    const timer = new Timer({
      description: 'running this test',
      timeout: 999,
    });

    timer.dispose();
    jest.advanceTimersByTime(2000);
    await expect(timer.run(() => 5)).resolves.toBe(5);
  });

  it('should reset timer while it is running', async () => {
    const timer = new Timer({
      description: 'running this test',
      timeout: 500,
    });

    jest.advanceTimersByTime(499);
    timer.reset(100);

    jest.advanceTimersByTime(99);

    await expect(timer.run(() => 5)).resolves.toBe(5);
    jest.advanceTimersByTime(1);
    await expect(timer.run(() => 5))
      .rejects.toThrowError(/Exceeded timeout of 100ms while running this test/);
  });

  it('should reset timer after timeout', async () => {
    const timer = new Timer({
      description: 'running this test',
      timeout: 500,
    });

    jest.advanceTimersByTime(500);
    await expect(timer.run(() => 5))
      .rejects.toThrowError(/Exceeded timeout of 500ms while running this test/);

    timer.reset(100);
    await expect(timer.run(() => 5)).resolves.toBe(5);

    jest.advanceTimersByTime(100);
    await expect(timer.run(() => 5))
      .rejects.toThrowError(/Exceeded timeout of 100ms while running this test/);
  });
});
