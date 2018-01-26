jest.mock('child-process-promise');

const ArtifactsCopier = require('./ArtifactsCopier');
const DeviceDriverBase = require('../devices/DeviceDriverBase');
const {exec} = require('child-process-promise');

describe('ArtifactsCopier', () => {
  it('copies stdout and stderr logs', async () => {
    const stdio = {
      stdout: '/tmp/stdout.txt',
      stderr: '/tmp/stderr.txt'
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

  it('adds single artifact for copying', async () => {
    const ac = copier('/logs');

    const src = '/tmp/' + Math.random() + '.txt';
    const name = 'custom-log';

    ac.addArtifact(src, name);
    await ac.finalizeArtifacts();

    expect(exec).toBeCalledWith(`cp "${src}" "/logs/1.${name}.txt"`);
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
