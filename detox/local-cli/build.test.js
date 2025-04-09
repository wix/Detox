const tempfile = require('tempfile');

const { callCli } = require('../__tests__/helpers');

describe('build', () => {
  let execSync, detox;

  beforeEach(() => {
    jest.mock('child_process');
    execSync = require('child_process').execSync;

    jest.mock('../src/utils/logger');
    jest.mock('../internals', () => {
      const DetoxConfigErrorComposer = require('../src/errors/DetoxConfigErrorComposer');

      const config = {
        apps: {},
        artifacts: {},
        behavior: {},
        commands: [],
        errorComposer: new DetoxConfigErrorComposer(),
        device: {},
        session: {}
      };

      return ({
        config,
        resolveConfig: jest.fn().mockResolvedValue(config),
        log: require('../src/utils/logger')
      });
    });

    detox = require('../internals');
  });

  it('passes argv to resolveConfig', async () => {
    await callCli('./build', 'build -C /etc/.detoxrc.js -c myconf').catch(() => {});

    expect(detox.resolveConfig).toHaveBeenCalledWith({
      argv: expect.objectContaining({
        'C': '/etc/.detoxrc.js',
        'c': 'myconf',
      }),
    });
  });

  it('runs the build script from the composed device config', async () => {
    detox.config.commands = [{ appName: 'default', build: 'yet another command' }];

    await callCli('./build', 'build');
    expect(execSync).toHaveBeenCalledWith('yet another command', expect.anything());
  });

  it('skips building the app if the binary exists and --if-missing flag is set', async () => {
    detox.config.apps.default = { binaryPath: __filename };
    detox.config.commands = [{ appName: 'default', build: 'yet another command' }];

    await callCli('./build', 'build -i');
    expect(execSync).not.toHaveBeenCalled();

    await callCli('./build', 'build --if-missing');
    expect(execSync).not.toHaveBeenCalled();

    expect(detox.log.info).toHaveBeenCalledWith('Skipping build for "default" app...');
  });

  it('should not skip building the app if the test binary does not exist', async () => {
    detox.config.apps.default = { binaryPath: __filename, testBinaryPath: __filename + '.doesnotexist' };
    detox.config.commands = [{ appName: 'default', build: 'yet another command' }];

    await callCli('./build', 'build --if-missing');
    expect(execSync).toHaveBeenCalled();
  });

  it('skips building the multi-app build command if all apps exist and --if-missing flag is set', async () => {
    detox.config.apps.app1 = { binaryPath: __filename };
    detox.config.apps.app2 = { binaryPath: __filename };
    detox.config.commands = [
      { build: 'yet another command' },
    ];

    await callCli('./build', 'build -i');
    expect(execSync).not.toHaveBeenCalled();

    await callCli('./build', 'build --if-missing');
    expect(execSync).not.toHaveBeenCalled();

    expect(detox.log.info).toHaveBeenCalledWith('Skipping build...');
  });

  it('should not skip building the multi-app build command if one app does not exist', async () => {
    detox.config.apps.app1 = { binaryPath: __filename };
    detox.config.apps.app2 = { binaryPath: __filename + '.doesnotexist' };
    detox.config.commands = [
      { build: 'yet another command' },
    ];

    await callCli('./build', 'build --if-missing');
    expect(execSync).toHaveBeenCalled();
    expect(detox.log.info).not.toHaveBeenCalledWith('Skipping build...');
  });

  it('fails with an error if a build script has not been found', async () => {
    detox.config.apps.default = {};
    detox.config.commands = [{ appName: 'default', start: 'a command' }];
    await expect(callCli('./build', 'build')).rejects.toThrowError(/Failed to build/);
  });

  it('should ignore missing build command with -s, --silent flag', async () => {
    detox.config.apps.default = {};
    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(detox.log.warn).not.toHaveBeenCalled();
  });

  it('should print a warning upon user build script failure', async () => {
    detox.config.commands = [{ appName: 'default', build: 'a command' }];
    execSync.mockImplementation(() => { throw new Error('Build failure'); });
    await expect(callCli('./build', 'build')).rejects.toThrowError(/Build failure/);
    expect(detox.log.warn).toHaveBeenCalledWith(expect.stringContaining('You are responsible'));
  });

  it('should print a warning if app is not found at binary path', async () => {
    detox.config.apps.default = { binaryPath: tempfile() };
    detox.config.commands = [{ appName: 'default', build: ':' }];

    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(detox.log.warn).toHaveBeenCalledWith(expect.stringContaining('could not find your app at the given binary path'));
  });

  it('should print extra message with the app name before building (in a multi-app configuration)', async () => {
    detox.config.apps.app1 = { binaryPath: tempfile() };
    detox.config.apps.app2 = { binaryPath: tempfile() };
    detox.config.commands = [{ appName: 'app1', build: 'app1 build' }, { appName: 'app2', build: 'app2 build' }];

    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(detox.log.info).toHaveBeenCalledWith(expect.stringContaining('app1'));
    expect(detox.log.info).toHaveBeenCalledWith(expect.stringContaining('app2'));
  });

  it('should not print that extra message when the app is single', async () => {
    detox.config.apps.default = { binaryPath: tempfile() };
    detox.config.commands = [{ appName: 'default', build: ':' }];

    await expect(callCli('./build', 'build -s')).resolves.not.toThrowError();
    expect(detox.log.info).not.toHaveBeenCalledWith(expect.stringContaining('default'));
  });
});
