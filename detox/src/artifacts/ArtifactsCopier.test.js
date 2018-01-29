jest.mock('child-process-promise');

const ArtifactsCopier = require('./ArtifactsCopier');
const FileArtifact = require('./FileArtifact');
const DeviceDriverBase = require('../devices/DeviceDriverBase');
const {exec} = require('child-process-promise');

describe('ArtifactsCopier', () => {
  it('copies stdout and stderr logs', async () => {
    const stdio = {
      stdout: new FileArtifact('/tmp/stdout.txt'),
      stderr: new FileArtifact('/tmp/stderr.txt')
    };
    await copier('/logs', stdio).finalizeArtifacts();
    expect(exec).toBeCalledWith(`cp "/tmp/stdout.txt" "/logs/1.out.log"`);
    expect(exec).toBeCalledWith(`cp "/tmp/stderr.txt" "/logs/1.err.log"`);
  });

  it('does not try to copy stdout and stderr logs if not available', async () => {
    await copier('/logs').finalizeArtifacts();
    expect(exec).not.toBeCalledWith(`cp "undefined" "/logs/1.out.log"`);
    expect(exec).not.toBeCalledWith(`cp "undefined" "/logs/1.err.log"`);
  });

  it('adds single artifact', async () => {
    const ac = copier('/logs');

    const src = '/tmp/' + Math.random() + '.txt';
    const name = 'custom-log';

    ac.addArtifact(new FileArtifact(src), name);
    await ac.finalizeArtifacts();

    expect(exec).toBeCalledWith(`mv "${src}" "/logs/1.${name}.txt"`);
  });

  it('cleans up added artifacts after finalizeArtifacts()', async () => {
    const ac = copier('/logs');
    ac.addArtifact(new FileArtifact('/tmp/' + Math.random() + '.txt'), 'custom-log');

    await ac.finalizeArtifacts();
    await ac.finalizeArtifacts();

    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('queues artifacts', async () => {
    const ac = copier();
    const src1 = '/tmp/' + Math.random() + '.txt';
    const src2 = '/tmp/' + Math.random() + '.txt';

    ac.setArtifactsDestination('/logs/1');
    ac.queueArtifact(new FileArtifact(src1), 'record');

    ac.setArtifactsDestination('/logs/2');
    ac.queueArtifact(new FileArtifact(src2), 'record');

    await ac.processQueue();
    expect(exec).toBeCalledWith(`mv "${src1}" "/logs/1/1.record.txt"`);
    expect(exec).toBeCalledWith(`mv "${src2}" "/logs/2/1.record.txt"`);
  });

  it('cleans up queues artifacts after processing', async () => {
    const ac = copier('/logs');
    ac.queueArtifact(new FileArtifact('/tmp/' + Math.random() + '.txt'), 'record');

    await ac.processQueue();
    await ac.processQueue();

    expect(exec).toHaveBeenCalledTimes(1);
  });
});

function copier(dest, logs) {
  const ac = new ArtifactsCopier(deviceDriver(logs));
  ac.setArtifactsDestination(dest);
  return ac;
}

function deviceDriver(logs) {
  const driver = new DeviceDriverBase();
  if (logs) {
    driver.getLogsPaths = () => logs;
  }
  return driver;
}
