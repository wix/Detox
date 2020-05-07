const _ = require('lodash');
const path = require('path');
const schemes = require('./configurations.mock');

jest.mock('./utils/argparse');

describe('configuration', () => {
  let args;
  let configuration;
  let detoxConfig;
  let deviceConfig;
  let userParams;

  beforeEach(() => {
    args = {};
    detoxConfig = {};
    deviceConfig = {};
    userParams = undefined;

    require('./utils/argparse').getArgValue.mockImplementation(key => args[key]);
    configuration = require('./configuration');
  });

  describe('composeArtifactsConfig', () => {
    it('should produce a default config', () => {
      expect(configuration.composeArtifactsConfig({
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
        cliConfig: {},
      }).pathBuilder).toBeInstanceOf(FakePathBuilder);
    });

    it('should resolve path builder from string (relative path)', () => {
      expect(configuration.composeArtifactsConfig({
        configurationName: 'customization',
        deviceConfig: {
          artifacts: {
            pathBuilder: './package.json',
          },
        },
        detoxConfig: {},
        cliConfig: {},
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
        cliConfig: {},
      })).toMatchObject({
        rootDir: '.artifacts/',
      });
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

  describe('composeBehaviorConfig', () => {
    let composed = () => configuration.composeBehaviorConfig({
      deviceConfig,
      detoxConfig,
      userParams,
    });

    it('should return a default behavior if nothing is set', () => {
      expect(composed()).toEqual({
        init: {
          exposeGlobals: true,
          reinstallApp: true,
          launchApp: true,
        },
        cleanup: {
          shutdownDevice: false,
        },
      })
    });

    describe('if detox config is set', () => {
      beforeEach(() => {
        detoxConfig = {
          behavior: {
            init: {
              exposeGlobals: false,
              reinstallApp: false,
              launchApp: false,
            },
            cleanup: {
              shutdownDevice: true,
            },
          },
        };
      });

      it('should override the defaults', () => {
        const expected = _.cloneDeep(detoxConfig.behavior);
        const actual = composed();

        expect(actual).toEqual(expected);
      });

      describe('if device config is set', () => {
        beforeEach(() => {
          deviceConfig = {
            behavior: {
              init: {
                exposeGlobals: true,
                reinstallApp: true,
                launchApp: true,
              },
              cleanup: {
                shutdownDevice: false,
              },
            },
          };
        });

        it('should override the defaults from detox config', () => {
          const expected = _.cloneDeep(deviceConfig.behavior);
          const actual = composed();

          expect(actual).toEqual(expected);
        });

        describe('if user params is set', () => {
          beforeEach(() => {
            userParams = {
              initGlobals: false,
              launchApp: false,
              reuse: false,
            };
          });

          it('should override the defaults from device config', () => {
            expect(composed()).toEqual({
              init: {
                exposeGlobals: false,
                reinstallApp: true,
                launchApp: false,
              },
              cleanup: {
                shutdownDevice: false,
              }
            });
          });

          describe('if cli args are set', () => {
            beforeEach(() => {
              args.reuse = true;
              args.cleanup = true;
            });

            it('should override the user params', () => {
              expect(composed()).toEqual({
                init: {
                  exposeGlobals: false,
                  reinstallApp: false,
                  launchApp: false,
                },
                cleanup: {
                  shutdownDevice: true,
                }
              });
            });
          });
        });
      });
    });
  });

  describe('composeDeviceConfig', () => {
    let configs;

    beforeEach(() => {
      configs = [1, 2].map(i => ({
        type: `someDriver${i}`,
        device: `someDevice${i}`,
      }));
    });

    describe('validation', () => {
      it('should throw if no configurations are passed', () => {
        expect(() => configuration.composeDeviceConfig({
          configurations: {},
        })).toThrowError(/There are no device configurations/);
      });

      it('should throw if configuration driver (type) is not defined', () => {
        expect(() => configuration.composeDeviceConfig({
          configurations: {
            undefinedDriver: {
              device: { type: 'iPhone X' },
            },
          },
        })).toThrowError(/type.*missing.*ios.simulator.*android.emulator/);
      });

      it('should throw if device query is not defined', () => {
        expect(() => configuration.composeDeviceConfig({
          configurations: {
            undefinedDeviceQuery: {
              type: 'ios.simulator',
            },
          },
        })).toThrowError(/device.*empty.*device.*query.*type.*avdName/);
      });
    });

    describe('for no specified configuration name', () => {
      beforeEach(() => { delete args.configuration; });

      describe('when there is a single config', () => {
        it('should return it', () => {
          const singleDeviceConfig = configs[0];

          expect(configuration.composeDeviceConfig({
            configurations: {singleDeviceConfig }
          })).toBe(singleDeviceConfig);
        });
      });

      describe('when there is more than one config', () => {
        it('should throw if there is more than one config', () => {
          const [config1, config2] = configs;
          expect(() => configuration.composeDeviceConfig({
            configurations: { config1, config2 },
          })).toThrowError(/Cannot determine/);
        });

        describe('but also selectedConfiguration param is specified', () => {
          it('should select that configuration', () => {
            const [config1, config2] = configs;

            expect(configuration.composeDeviceConfig({
              selectedConfiguration: 'config1',
              configurations: { config1, config2 },
            })).toEqual(config1);
          });
        });
      });
    });

    describe('for a specified configuration name', () => {
      let sampleConfigs;

      beforeEach(() => {
        args.configuration = 'config2';

        const [config1, config2] = [1, 2].map(i => ({
          type: `someDriver${i}`,
          device: `someDevice${i}`,
        }));

        sampleConfigs = { config1, config2 };
      });

      it('should return that config', () => {
        expect(configuration.composeDeviceConfig({
          configurations: sampleConfigs
        })).toEqual(sampleConfigs.config2);
      });

      describe('if device-name override is present', () => {
        beforeEach(() => { args['device-name'] = 'Override'; });

        it('should return that config with an overriden device query', () => {
          expect(configuration.composeDeviceConfig({
            configurations: sampleConfigs
          })).toEqual({
            ...sampleConfigs.config2,
            device: 'Override',
          });
        });
      })
    });
  });

  describe('composeSessionConfig', () => {
    const compose = () => configuration.composeSessionConfig({
      detoxConfig,
      deviceConfig,
    });

    it('should generate a default config', async () => {
      const sessionConfig = await compose();

      expect(sessionConfig).toMatchObject({
        autoStart: true,
        server: expect.stringMatching(/^ws:.*localhost:/),
        sessionId: expect.stringMatching(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i),
      });
    });

    describe('if detoxConfig.session is defined', function() {
      beforeEach(() => {
        detoxConfig.session = {
          server: 'ws://localhost:9999',
          sessionId: 'someSessionId',
        };
      })

      it('should return detoxConfig.session', async () => {
        expect(await compose()).toEqual({
          server: 'ws://localhost:9999',
          sessionId: 'someSessionId',
        });
      });

      test(`providing empty server config should throw`, () => {
        delete detoxConfig.session.server;
        expect(compose()).rejects.toThrowError(/session.server.*missing/);
      });

      test(`providing server config with no session should throw`, () => {
        delete detoxConfig.session.sessionId;
        expect(compose()).rejects.toThrowError(/session.sessionId.*missing/);
      });

      describe('if deviceConfig.session is defined', function() {
        beforeEach(() => {
          detoxConfig.session = {
            server: 'ws://localhost:1111',
            sessionId: 'anotherSession',
          };
        });

        it('should return deviceConfig.session instead of detoxConfig.session', async () => {
          expect(await compose()).toEqual({
            server: 'ws://localhost:1111',
            sessionId: 'anotherSession',
          });
        });
      });
    });
  });

  describe('composeDetoxConfig', () => {
    it('should throw if no config given', async () => {
      await expect(configuration.composeDetoxConfig()).rejects.toThrowError(
        /No configuration was passed/
      );
    });

    it('should return a complete Detox config', async () => {
      const config = await configuration.composeDetoxConfig({
        configurations: {
          simple: {
            type: 'ios.simulator',
            device: 'iPhone X',
          },
        },
      });

      expect(config).toMatchObject({
        artifactsConfig: expect.objectContaining({}),
        behaviorConfig: expect.objectContaining({}),
        deviceConfig: expect.objectContaining({}),
        sessionConfig: expect.objectContaining({}),
      });
    });
  });

  describe('throwOnBinaryPath', () => {
    it('should throw an error', () => {
      expect(() => configuration.throwOnEmptyBinaryPath()).toThrowError(
        /binaryPath.*missing/
      );
    })
  })
});
