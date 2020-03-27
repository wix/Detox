const _ = require('lodash');
const path = require('path');
const schemes = require('./configurations.mock');

describe('configuration', () => {
  let configuration;
  beforeEach(() => {
    configuration = require('./configuration');
  });

  it(`generate a default config`, async () => {
    const config = await configuration.defaultSession();
    expect(() => config.session.server).toBeDefined();
    expect(() => config.session.sessionId).toBeDefined();
  });

  it(`providing a valid config`, () => {
    expect(() => configuration.validateSession(schemes.validOneDeviceAndSession.session)).not.toThrow();
  });

  it(`providing empty server config should throw`, () => {
    testFaultySession();
  });

  it(`providing server config with no session should throw`, () => {
    testFaultySession(schemes.validOneDeviceNoSession.session);
  });

  it(`providing server config with no session.server should throw`, () => {
    testFaultySession(schemes.invalidSessionNoServer.session);
  });

  it(`providing server config with no session.sessionId should throw`, () => {
    testFaultySession(schemes.invalidSessionNoSessionId.session);
  });

  describe('composeArtifactsConfig', () => {
    it('should produce a default config', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'abracadabra',
        deviceConfig: {},
        detoxConfig: {},
      })).toMatchObject({
        pathBuilder: expect.objectContaining({
          rootDir: expect.stringMatching(/^artifacts[\\\/]abracadabra\.\d{4}/),
        }),
        plugins: schemes.pluginsDefaultsResolved,
      });
    });

    it('should use artifacts config from the selected configuration', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'abracadabra',
        deviceConfig: {
          artifacts: {
            ...schemes.allArtifactsConfiguration,
            rootDir: 'otherPlace',
            pathBuilder: _.noop,
          }
        },
        detoxConfig: {},
        cliConfig: {}
      })).toMatchObject({
        pathBuilder: expect.objectContaining({
          rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
        }),
        plugins: schemes.pluginsAllResolved,
      });
    });

    it('should use global artifacts config', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'abracadabra',
        deviceConfig: {},
        detoxConfig: {
          artifacts: {
            ...schemes.allArtifactsConfiguration,
            rootDir: 'otherPlace',
            pathBuilder: _.noop,
          }
        },
        cliConfig: {}
      })).toMatchObject({
        pathBuilder: expect.objectContaining({
          rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
        }),
        plugins: schemes.pluginsAllResolved,
      });
    });

    it('should use CLI config', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'abracadabra',
        deviceConfig: {},
        detoxConfig: {},
        cliConfig: {
          artifactsLocation: 'otherPlace',
          recordLogs: 'all',
          takeScreenshots: 'all',
          recordVideos: 'all',
          recordPerformance: 'all',
          recordTimeline: 'all',
        }
      })).toMatchObject({
        pathBuilder: expect.objectContaining({
          rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
        }),
        plugins: schemes.pluginsAllResolved,
      });
    });

    it('should prefer CLI config over selected configuration over global config', () => {
      expect(configuration.composeArtifactsConfig({
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
      const FakePathBuilder = require('./artifacts/__mocks__/FakePathBuilder');
      expect(configuration.composeArtifactsConfig({
        configurationName: 'customization',
        deviceConfig: {
          artifacts: {
            pathBuilder: path.join(__dirname, 'artifacts/__mocks__/FakePathBuilder')
          },
        },
        detoxConfig: {},
      }).pathBuilder).toBeInstanceOf(FakePathBuilder);
    });

    it('should resolve path builder from string (relative path)', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'customization',
        deviceConfig: {
          artifacts: {
            pathBuilder: 'package.json',
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
      expect(configuration.composeArtifactsConfig({
        configurationName: 'customization',
        deviceConfig: {
          artifacts: {
            rootDir: '.artifacts/'
          },
        },
        detoxConfig: {},
      })).toMatchObject({
        rootDir: '.artifacts/',
      });
    });

    describe('screenshot plugin', () => {
      // undefined + none => !enabled, !failingOnly, !automatic
      // undefined + manual => enabled, !failingOnly, !automatic
      // undefined + failing => enabled, failingOnly, automatic
      // undefined + all => enabled, !failingOnly, automatic

      // ANY + ANY === ANY
      // ANY + {} === ANY

      // .automatic.x + none => !enabled
      // .automatic.x + manual => enabled, !automatic
      // .automatic.x + failing => enabled, failingOnly
      // .automatic.x + all => enabled, !failingOnly

      // .automatic.!x + none => !enabled, !failingOnly, !automatic
      // .automatic.!x + manual =>
      // .automatic.!x + failing =>
      // .automatic.!x + all =>

      // .!automatic + none => ?
      // .!automatic + manual + { shouldTakeAutomaticSnapshots: false } + all ===
      // .!automatic + failing + { shouldTakeAutomaticSnapshots: false } + all ===
      // .!automatic + all + { shouldTakeAutomaticSnapshots: false } + all ===
      // defaults + cli:all => all + automatic

      // .enabled
      // undefined + manual => enabled, !failingOnly, !automatic
      // undefined + failing => enabled, failingOnly, automatic
      // undefined + all => enabled, !failingOnly, automatic
    });

    it('should allow passing custom plugin configurations', () => {
      expect(configuration.composeArtifactsConfig({
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
                shouldTakeAutomaticSnapshots: {
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
            shouldTakeAutomaticSnapshots: {
              testStart: false,
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

    it('should allow simple cases TODO', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'custom',
        cliConfig: {
          takeScreenshots: 'all',
        },
        detoxConfig: {
          artifacts: {
            rootDir: 'configuration',
            pathBuilder: _.identity,
          },
        },
        deviceConfig: {},
      })).toMatchObject({
        plugins: expect.objectContaining({
          screenshot: {
            enabled: true,
            keepOnlyFailedTestsArtifacts: false,
            shouldTakeAutomaticSnapshots: {
              testStart: true,
              testDone: true,
            },
          },
        }),
      });
    });
  });

  function testFaultySession(config) {
    try {
      configuration.validateSession(config);
    } catch (ex) {
      expect(ex).toBeDefined();
    }
  }
});
