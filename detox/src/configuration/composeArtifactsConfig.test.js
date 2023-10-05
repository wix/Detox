const schemes = require('./configurations.mock');

describe('composeArtifactsConfig', () => {
  let composeArtifactsConfig;

  beforeEach(() => {
    composeArtifactsConfig = require('./composeArtifactsConfig');
  });

  it('should produce a default config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      localConfig: {},
      globalConfig: {},
      cliConfig: {},
    })).toMatchObject({
      rootDir: expect.stringMatching(/^artifacts[\\/]abracadabra\.\d{4}/),
      plugins: schemes.pluginsDefaultsResolved,
    });
  });

  it('should use artifacts configuration from the local config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      localConfig: {
        artifacts: {
          ...schemes.allArtifactsConfiguration,
          rootDir: 'otherPlace',
          pathBuilder: '@local/pathbuilder',
        }
      },
      globalConfig: {},
      cliConfig: {},
    })).toMatchObject({
      rootDir: expect.stringMatching(/^otherPlace[\\/]abracadabra\.\d{4}/),
      pathBuilder: '@local/pathbuilder',
      plugins: schemes.pluginsAllResolved,
    });
  });

  it('should use artifacts configuration from the global config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      localConfig: {},
      globalConfig: {
        artifacts: {
          ...schemes.allArtifactsConfiguration,
          rootDir: 'otherPlace',
          pathBuilder: '@global/pathbuilder',
        }
      },
      cliConfig: {},
    })).toMatchObject({
      rootDir: expect.stringMatching(/^otherPlace[\\/]abracadabra\.\d{4}/),
      plugins: schemes.pluginsAllResolved,
    });
  });

  it('should disable global artifacts config if local config has artifacts = false', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      localConfig: {
        artifacts: false,
      },
      globalConfig: {
        artifacts: {
          ...schemes.allArtifactsConfiguration,
          rootDir: 'otherPlace',
          pathBuilder: '@global/pathbuilder',
        }
      },
      cliConfig: {},
    })).toMatchObject({
      rootDir: expect.stringMatching(/^artifacts[\\/]abracadabra\.\d{4}/),
      pathBuilder: undefined,
      plugins: schemes.pluginsDefaultsResolved,
    });
  });

  it('should also use CLI config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      localConfig: {},
      globalConfig: {},
      cliConfig: {
        artifactsLocation: 'otherPlace',
        recordLogs: 'all',
        recordPerformance: 'all',
        recordVideos: 'all',
        takeScreenshots: 'all',
        captureViewHierarchy: 'enabled',
      },
    })).toMatchObject({
      rootDir: expect.stringMatching(/^otherPlace[\\/]abracadabra\.\d{4}/),
      plugins: schemes.pluginsAllResolved,
    });
  });

  it('should prefer CLI config over the local config and over the global config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'priority',
      cliConfig: {
        artifactsLocation: 'cli',
      },
      localConfig: {
        artifacts: {
          rootDir: 'configuration',
          pathBuilder: '@local/pathbuilder',
          plugins: {
            log: 'failing',
          },
        },
      },
      globalConfig: {
        artifacts: {
          rootDir: 'global',
          pathBuilder: '@global/pathbuilder',
          plugins: {
            screenshot: 'all',
          },
        },
      },
    })).toMatchObject({
      rootDir: expect.stringMatching(/^cli[\\/]priority\.\d{4}/),
      pathBuilder: '@local/pathbuilder',
      plugins: {
        log: schemes.pluginsFailingResolved.log,
        screenshot: schemes.pluginsAllResolved.screenshot,
        video: schemes.pluginsDefaultsResolved.video,
        instruments: schemes.pluginsDefaultsResolved.instruments,
      },
    });
  });

  it('should not append configuration with timestamp if rootDir ends with slash', () => {
    expect(composeArtifactsConfig({
      configurationName: 'customization',
      localConfig: {
        artifacts: {
          rootDir: '.artifacts/'
        },
      },
      globalConfig: {},
      cliConfig: {},
    })).toMatchObject({
      rootDir: '.artifacts',
    });
  });

  it('should allow passing custom plugin configurations', () => {
    expect(composeArtifactsConfig({
      configurationName: 'custom',
      cliConfig: {
        takeScreenshots: 'all',
      },
      globalConfig: {
        artifacts: {
          rootDir: 'configuration',
          plugins: {
            screenshot: {
              takeWhen: {
                testDone: true,
              },
            },
            video: {
              android: { bitRate: 4000000 },
              simulator: { codec: 'hevc' },
            }
          },
        },
      },
      localConfig: {},
    })).toMatchObject({
      plugins: expect.objectContaining({
        screenshot: {
          ...schemes.pluginsAllResolved.screenshot,
          takeWhen: {
            testDone: true,
          },
        },
        video: {
          ...schemes.pluginsDefaultsResolved.video,
          android: { bitRate: 4000000 },
          simulator: { codec: 'hevc' },
        },
      }),
    });
  });
});
