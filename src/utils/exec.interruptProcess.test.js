jest.mock('./logger');

const { interruptProcess, spawnAndLog } = require('./exec');

describe(interruptProcess.name, () => {
  it('should interrupt a child process promise', async () => {
    await interruptProcess(spawnAndLog('sleep', ['3']));
  }, 500);

  it('should throw exception if child process exited with an error', async () => {
    const script =
      "process.on('SIGINT', () => {});" +
      "setTimeout(()=>process.exit(1), 100);";

    await interruptProcess(spawnAndLog('node', ['-e', script]));
  }, 1000);
});
