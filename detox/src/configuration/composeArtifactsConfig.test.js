const _ = require('lodash');
const path = require('path');
const schemes = require('./configurations.mock');

describe('composeArtifactsConfig', () => {
  let composeArtifactsConfig;

  beforeEach(() => {
    composeArtifactsConfig = require('./composeArtifactsConfig');
  });

  it('should produce a default config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      deviceConfig: {},
      detoxConfig: {},
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^artifacts[\\\/]abracadabra\.\d{4}/),
      }),
      plugins: schemes.pluginsDefaultsResolved,
    });
  });

  it('should use artifacts config from the selected configuration', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      deviceConfig: {
        artifacts: {
          ...schemes.allArtifactsConfiguration,
          rootDir: 'otherPlace',
          pathBuilder: _.noop,
        }
      },
      detoxConfig: {},
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
      }),
      plugins: schemes.pluginsAllResolved,
    });
  });

  it('should use global artifacts config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      deviceConfig: {},
      detoxConfig: {
        artifacts: {
          ...schemes.allArtifactsConfiguration,
          rootDir: 'otherPlace',
          pathBuilder: _.noop,
        }
      },
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
      }),
      plugins: schemes.pluginsAllResolved,
    });
  });

  it('should disable global artifacts config if deviceConfig.artifacts = false', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      deviceConfig: {
        artifacts: false,
      },
      detoxConfig: {
        artifacts: {
          ...schemes.allArtifactsConfiguration,
          rootDir: 'otherPlace',
          pathBuilder: _.noop,
        }
      },
      cliConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        rootDir: expect.stringMatching(/^artifacts[\\\/]abracadabra\.\d{4}/),
      }),
      plugins: schemes.pluginsDefaultsResolved,
    });
  });

  it('should use CLI config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'abracadabra',
      deviceConfig: {},
      detoxConfig: {},
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
        rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
      }),
      plugins: schemes.pluginsAllResolved,
    });
  });

  it('should prefer CLI config over selected configuration over global config', () => {
    expect(composeArtifactsConfig({
      configurationName: 'priority',
      cliConfig: {
        artifactsLocation: 'cli',
      },
      deviceConfig: {
        artifacts: {
          rootDir: 'configuration',
          pathBuilder: _.identity,
          plugins: {
            log: 'failing',
          },
        },
      },
      detoxConfig: {
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
        rootDir: expect.stringMatching(/^cli[\\\/]priority\.\d{4}/),
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
      deviceConfig: {
        artifacts: {
          pathBuilder: path.join(__dirname, '../artifacts/__mocks__/FakePathBuilder')
        },
      },
      detoxConfig: {},
      cliConfig: {},
    }).pathBuilder).toBeInstanceOf(FakePathBuilder);
  });

  it('should resolve path builder from string (relative path)', () => {
    expect(composeArtifactsConfig({
      configurationName: 'customization',
      cliConfig: {},
      deviceConfig: {
        artifacts: {
          pathBuilder: './package.json',
        },
      },
      detoxConfig: {},
    })).toMatchObject({
      pathBuilder: expect.objectContaining({
        "name": expect.any(String),
        "version": expect.any(String),
      }),
    });
  });

  it('should not append configuration with timestamp if rootDir ends with slash', () => {
    expect(composeArtifactsConfig({
      configurationName: 'customization',
      deviceConfig: {
        artifacts: {
          rootDir: '.artifacts/'
        },
      },
      detoxConfig: {},
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
      detoxConfig: {
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
              simulator: { codec: "hevc" },
            }
          },
        },
      },
      deviceConfig: {},
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
          simulator: { codec: "hevc" },
        },
      }),
    });
  });
});
