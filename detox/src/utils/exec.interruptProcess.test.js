jest.mock('./logger');

const { interruptProcess, spawnAndLog } = require('./exec');

describe('interruptProcess', () => {
  it('should interrupt a child process promise', async () => {
    await interruptProcess(spawnAndLog('sleep', ['3']));
  }, 500);

  it('should throw exception if child process exited with an error', async () => {
    const script =
      "process.on('SIGINT', () => {});" +
      'setTimeout(()=>process.exit(1), 100);';

    await interruptProcess(spawnAndLog('node', ['-e', script]));
  }, 1000);

  it('should SIGTERM a stuck process after specified time', async () => {
    const script =
      "process.on('SIGINT', () => {});" +
      'setTimeout(()=>process.exit(1), 10000);';

    const theProcess = spawnAndLog('node', ['-e', script]);
    await interruptProcess(theProcess, {
      SIGTERM: 500
    });
  }, 1000);
});
