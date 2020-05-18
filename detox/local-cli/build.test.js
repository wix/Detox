jest.mock('child_process');
jest.mock('../src/utils/logger');
jest.mock('../src/configuration');

describe('build', () => {
  let execSync, composeDetoxConfig, detoxConfig;

  beforeEach(() => {
    detoxConfig = {
      meta: {
        configuration: 'testConfig',
        location: '/etc/detox/config',
      },
      artifactsConfig: {},
      behaviorConfig: {},
      deviceConfig: {},
      sessionConfig: {},
    };

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
    detoxConfig.deviceConfig.build = 'yet another command';

    await callCli('./build', 'build');
    expect(execSync).toHaveBeenCalledWith('yet another command', expect.anything());
  });

  it('fails with an error if a build script has not been found', async () => {
    delete detoxConfig.deviceConfig.build;
    await expect(callCli('./build', 'build')).rejects.toThrowErrorMatchingSnapshot();
  });
});
