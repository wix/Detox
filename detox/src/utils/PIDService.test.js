const cp = require('child_process');

const PIDService = require('./PIDService');

describe('PIDService', () => {
  let pidService;

  beforeEach(() => {
    pidService = new PIDService();
  });

  it('should return the current process id', () => {
    expect(pidService.getPid()).toBe(process.pid);
  });

  it('should tell whether the process is alive', () => {
    expect(pidService.isAlive(process.pid)).toBe(true);

    const { pid: deadPID } = cp.spawnSync('node', ['-e', 'process.exit(0)']);
    expect(pidService.isAlive(deadPID)).toBe(false);
  });

  it('should throw errors other than ESRCH', () => {
    expect(() => pidService.isAlive(NaN)).toThrow();
  });
});
