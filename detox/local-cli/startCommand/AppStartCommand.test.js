const { EventEmitter } = require('events');

jest.mock('child_process');
jest.mock('../../src/utils/logger');
jest.mock('../../internals', () => ({
  log: require('../../src/utils/logger'),
}));

describe('AppStartCommand', () => {
  let AppStartCommand, spawn, mockChild;

  beforeEach(() => {
    jest.useFakeTimers();
    spawn = require('child_process').spawn;
    AppStartCommand = require('./AppStartCommand');
    mockChild = Object.assign(new EventEmitter(), { kill: jest.fn() });
    spawn.mockReturnValue(mockChild);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
  });

  it('escalates to SIGKILL if process does not exit after SIGTERM', async () => {
    const cmd = new AppStartCommand({ cmd: 'sleep 100', forceSpawn: true });
    cmd.execute();

    const stopPromise = cmd.stop();
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    expect(mockChild.kill).not.toHaveBeenCalledWith('SIGKILL');

    jest.advanceTimersByTime(5001);
    expect(mockChild.kill).toHaveBeenCalledWith('SIGKILL');

    // Simulate the process finally exiting so stop() resolves
    mockChild.emit('exit', 1, null);
    await stopPromise;
  });

  it('does not send SIGKILL if process exits before the timeout fires', async () => {
    const cmd = new AppStartCommand({ cmd: 'sleep 100', forceSpawn: true });
    cmd.execute();

    const stopPromise = cmd.stop();
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');

    // Process exits shortly after SIGTERM — before the 5s timer fires
    mockChild.emit('exit', 0, null);
    await stopPromise;

    jest.advanceTimersByTime(5001);
    expect(mockChild.kill).not.toHaveBeenCalledWith('SIGKILL');
  });
});
