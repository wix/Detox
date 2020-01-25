const _ = require('lodash');
const path = require('path');
const schemes = require('./configurations.mock');
const LogArtifactPlugin = require('./artifacts/log/LogArtifactPlugin');
const ScreenshotArtifactPlugin = require('./artifacts/screenshot/ScreenshotArtifactPlugin');
const VideoArtifactPlugin = require('./artifacts/video/VideoArtifactPlugin');

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
      })).toEqual({
        rootDir: expect.stringMatching(/^artifacts[\\\/]abracadabra\.\d{4}/),
        pathBuilder: null,
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
      })).toEqual({
        rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
        pathBuilder: _.noop,
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
      })).toEqual({
        rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
        pathBuilder: _.noop,
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
        }
      })).toEqual({
        rootDir: expect.stringMatching(/^otherPlace[\\\/]abracadabra\.\d{4}/),
        pathBuilder: null,
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
      })).toEqual({
        rootDir: expect.stringMatching(/^cli[\\\/]priority\.\d{4}/),
        pathBuilder: _.identity,
        plugins: {
          log: schemes.pluginsFailingResolved.log,
          screenshot: schemes.pluginsAllResolved.screenshot,
          video: schemes.pluginsDefaultsResolved.video,
          instruments: schemes.pluginsDefaultsResolved.instruments,
        },
      });
    });

    it('should resolve path builder from string (absolute path)', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'customization',
        deviceConfig: {
          artifacts: {
            pathBuilder: path.join(__dirname, 'artifacts/__mocks__/FakePathBuilder')
          },
        },
        detoxConfig: {},
      })).toEqual(expect.objectContaining({
        pathBuilder: require('./artifacts/__mocks__/FakePathBuilder'),
      }));
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
      })).toEqual(expect.objectContaining({
        pathBuilder: require(path.join(process.cwd(), 'package.json')),
      }));
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
      })).toEqual(expect.objectContaining({
        rootDir: '.artifacts/',
      }));
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
