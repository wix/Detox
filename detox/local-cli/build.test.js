jest.mock('child_process');
jest.mock('../src/utils/logger');
jest.mock('../src/configuration');

const tempfile = require('tempfile');

const DetoxConfigErrorComposer = require('../src/errors/DetoxConfigErrorComposer');

describe('build', () => {
  let log, execSync, composeDetoxConfig, detoxConfig;

  beforeEach(() => {
    detoxConfig = {
      appsConfig: {},
      artifactsConfig: {},
      behaviorConfig: {},
      deviceConfig: {},
      sessionConfig: {},
      errorComposer: new DetoxConfigErrorComposer(),
    };

    log = require('../src/utils/logger');
    execSync = require('child_process').execSync;
    composeDetoxConfig = require('../src/configuration').composeDetoxConfig;
    composeDetoxConfig.mockReturnValue(Promise.resolve(detoxConfig));
  });

  it('passes argv to composeConfig', async () => {
    await callCli('./build', 'build -C /etc/.detoxrc.js -c myconf').catch(() => {});

    expect(composeDetoxConfig).toHaveBeenCalledWith({
      argv: expect.objectContaining({
        'config-path': '/etc/.detoxrc.js',
        'configuration': 'myconf',
      }),
    });
  });

  it('runs the build script from the composed device config', async () => {
    detoxConfig.appsConfig.default = { build: 'yet another command' };

    await callCli('./build', 'build');
    expect(execSync).toHaveBeenCalledWith('yet another command', expect.anything());
  });

  it('skips building the app if the binary exists and --if-missing flag is set', async () => {
    detoxConfig.appsConfig.default = { build: 'yet another command', binaryPath: __filename };

    await callCli('./build', 'build -i');
    expect(execSync).not.toHaveBeenCalled();

    await callCli('./build', 'build --if-missing');
    expect(execSync).not.toHaveBeenCalled();

    expect(log.info).toHaveBeenCalledWith('Skipping build for "default" app...');
  });

  it('fails with an error if a build script has not been found', async () => {
    detoxConfig.appsConfig.default = {};
    await expect(callCli('./build', 'build')).rejects.toThrowError(/Failed to build/);
  });

  it('should ignore missing build command with -s, --silent flag', async () => {
    detoxConfig.appsConfig.default = {};
    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('should print a warning upon user build script failure', async () => {
    detoxConfig.appsConfig.default = { build: 'a command' };
    execSync.mockImplementation(() => { throw new Error('Build failure'); });
    await expect(callCli('./build', 'build')).rejects.toThrowError(/Build failure/);
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('You are responsible'));
  });

  it('should print a warning if app is not found at binary path', async () => {
    detoxConfig.appsConfig.default = { binaryPath: tempfile() };
    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('could not find your app at the given binary path'));
  });

  it('should print extra message with the app name before building (in a multi-app configuration)', async () => {
    detoxConfig.appsConfig.app1 = { binaryPath: tempfile(), build: ':' };
    detoxConfig.appsConfig.app2 = { binaryPath: tempfile(), build: ':' };

    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('app1'));
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('app2'));
  });

  it('should not print that extra message when the app is single', async () => {
    detoxConfig.appsConfig.default = { binaryPath: tempfile(), build: ':' };

    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(log.info).not.toHaveBeenCalledWith(expect.stringContaining('default'));
  });
});
