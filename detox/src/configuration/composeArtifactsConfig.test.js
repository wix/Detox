const path = require('path');

const _ = require('lodash');

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
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^artifacts[\\/]abracadabra\.\d{4}/),
      }),
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
          pathBuilder: _.noop,
        }
      },
      globalConfig: {},
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^otherPlace[\\/]abracadabra\.\d{4}/),
      }),
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
          pathBuilder: _.noop,
        }
      },
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^otherPlace[\\/]abracadabra\.\d{4}/),
      }),
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
          pathBuilder: _.noop,
        }
      },
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^artifacts[\\/]abracadabra\.\d{4}/),
      }),
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
        recordTimeline: 'all',
        recordVideos: 'all',
        takeScreenshots: 'all',
        captureViewHierarchy: 'enabled',
      },
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^otherPlace[\\/]abracadabra\.\d{4}/),
      }),
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
          pathBuilder: _.identity,
          plugins: {
            log: 'failing',
          },
        },
      },
      globalConfig: {
        artifacts: {
          rootDir: 'global',
          pathBuilder: _.noop,
          plugins: {
            screenshot: 'all',
          },
        },
      },
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^cli[\\/]priority\.\d{4}/),
      }),
      plugins: {
        log: schemes.pluginsFailingResolved.log,
        screenshot: schemes.pluginsAllResolved.screenshot,
        video: schemes.pluginsDefaultsResolved.video,
        instruments: schemes.pluginsDefaultsResolved.instruments,
        timeline: schemes.pluginsDefaultsResolved.timeline,
      },
    });
  });

  it('should resolve path builder from string (absolute path)', () => {
    const FakePathBuilder = require('../artifacts/__mocks__/FakePathBuilder');
    expect(composeArtifactsConfig({
      configurationName: 'customization',
      localConfig: {
        artifacts: {
          pathBuilder: path.join(__dirname, '../artifacts/__mocks__/FakePathBuilder')
        },
      },
      globalConfig: {},
      cliConfig: {},
    }).pathBuilder).toBeInstanceOf(FakePathBuilder);
  });

  it('should resolve path builder from string (relative path)', () => {
    expect(composeArtifactsConfig({
      configurationName: 'customization',
      cliConfig: {},
      localConfig: {
        artifacts: {
          pathBuilder: './package.json',
        },
      },
      globalConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        'name': expect.any(String),
        'version': expect.any(String),
      }),
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
      rootDir: '.artifacts/',
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
          pathBuilder: _.identity,
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
