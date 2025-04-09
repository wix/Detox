const composeCommandsConfig = require('./composeCommandsConfig');

describe('composeCommandsConfig', () => {
  let appsConfig, localConfig;

  beforeEach(() => {
    appsConfig = {};
    localConfig = {};
  });

  const composed = () => composeCommandsConfig({ appsConfig, localConfig });

  it('should return an empty array if no commands are defined', () => {
    expect(composed()).toEqual([]);
  });

  it('should use commands from the local config', () => {
    localConfig = {
      build: 'multi build',
      start: 'multi start'
    };

    expect(composed()).toEqual([
      { build: 'multi build', start: 'multi start' }
    ]);
  });

  it('should use app commands from the apps config', () => {
    appsConfig = {
      app1: { build: 'app1 build', start: 'app1 start' },
      app2: { build: 'app2 build' }
    };

    expect(composed()).toEqual([
      { appName: 'app1', build: 'app1 build', start: 'app1 start' },
      { appName: 'app2', build: 'app2 build' }
    ]);
  });

  it('should combine commands from localConfig and appsConfig', () => {
    localConfig = {
      build: 'global build',
    };
    appsConfig = {
      app1: { build: 'app1 build', start: 'app1 start' },
      app2: { build: 'app2 build' }
    };

    expect(composed()).toEqual([
      { build: 'global build' },
      { appName: 'app1', start: 'app1 start' },
    ]);
  });

  it('should not include app commands if the local config has such commands', () => {
    localConfig = {
      build: 'global build',
      start: 'global start'
    };
    appsConfig = {
      app1: { build: 'app1 build', start: 'app1 start' }
    };

    expect(composed()).toEqual([
      { build: 'global build', start: 'global start' },
    ]);
  });

  it('should filter out entries without build or start commands', () => {
    appsConfig = {
      app1: { build: 'app1 build' },
      app2: {},
      app3: { start: 'app3 start' }
    };

    expect(composed()).toEqual([
      { appName: 'app1', build: 'app1 build' },
      { appName: 'app3', start: 'app3 start' }
    ]);
  });
});
