const cp = require('child_process');

const PIDService = require('./PIDService');

describe('PIDService', () => {
  it('should return the current process id', () => {
    const pidService = new PIDService();
    expect(pidService.getPid()).toBe(process.pid);
  });

  it('should tell whether the process is alive', () => {
    const pidService = new PIDService();
    expect(pidService.isAlive(process.pid)).toBe(true);

    const { pid: deadPID } = cp.spawnSync('node', ['-e', 'process.exit(0)']);
    expect(pidService.isAlive(deadPID)).toBe(false);
  });
});
