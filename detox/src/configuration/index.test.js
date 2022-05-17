// @ts-nocheck
jest.mock('../utils/argparse');

const os = require('os');
const path = require('path');

const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');

describe('composeDetoxConfig', () => {
  let args;
  let configuration;

  /** @type {DetoxConfigErrorComposer} */
  let errorComposer;

  beforeEach(() => {
    errorComposer = new DetoxConfigErrorComposer();

    args = {};

    require('../utils/argparse').getArgValue.mockImplementation(key => args[key]);
    configuration = require('./index');
  });

  describe('composeDetoxConfig', () => {
    it('should throw an error if no config is found in package.json', async () => {
      await expect(configuration.composeDetoxConfig({})).rejects.toThrowError(
        /external .detoxrc.json configuration/
      );
    });

    it('should throw an error if empty config is found at path', async () => {
      await expect(configuration.composeDetoxConfig({
        argv: {
          'config-path': path.join(__dirname, '__mocks__/configuration/priority/empty.js'),
        },
      })).rejects.toThrowError(/are no configurations in/);
    });

    it('should throw an error if no config is found at all', async () => {
      await expect(configuration.composeDetoxConfig({
        cwd: os.homedir(),
      })).rejects.toThrowError(errorComposer.noConfigurationSpecified());
    });

    it('should throw an error if the local config has the old schema', async () => {
      try {
        await configuration.composeDetoxConfig({
          cwd: path.join(__dirname, '__mocks__/configuration/oldschema'),
          errorComposer,
        });
      } catch (e) {
        // NOTE: we want errorComposer to be mutated, that's why we assert inside try-catch
        expect(e).toEqual(errorComposer.configurationShouldNotUseLegacyFormat());
      }
    });

    it('should return a complete Detox config merged with the file configuration', async () => {
      const config = await configuration.composeDetoxConfig({
        cwd: path.join(__dirname, '__mocks__/configuration/packagejson'),
        argv: {
          configuration: 'another',
          'device-name': 'iPhone XS',
          cleanup: true,
          reuse: true,
          'record-logs': 'all',
          'runner-config': 'e2e/jest.config.js',
        },
        override: {
          artifacts: {
            pathBuilder: class {
              constructor() {
                this.testProperty = 42;
              }
            },
            plugins: {
              log: 'none',
              video: 'failing',
            },
          },
          configurations: {
            another: {
              device: {
                type: 'ios.simulator',
                device: 'iPhone X'
              },
              app: {
                type: 'ios.app',
                binaryPath: 'path/to/app',
              },
            },
          },
        }
      });

      expect(config).toMatchObject({
        errorComposer: {
          configurationName: 'another',
          filepath: path.join(__dirname, '__mocks__/configuration/packagejson/package.json'),
        },
        artifactsConfig: {
          pathBuilder: {
            testProperty: 42,
          },
          plugins: {
            log: {
              enabled: true,
              keepOnlyFailedTestsArtifacts: false,
            },
            video: {
              enabled: true,
              keepOnlyFailedTestsArtifacts: true,
            },
          },
        },
        behaviorConfig: {
          init: {
            exposeGlobals: true,
            reinstallApp: false,
          },
          cleanup: {
            shutdownDevice: true,
          }
        },
        cliConfig: {
          configuration: 'another',
          deviceName: 'iPhone XS',
          cleanup: true,
          reuse: true,
          recordLogs: 'all',
          runnerConfig: 'e2e/jest.config.js',
        },
        deviceConfig: expect.objectContaining({
          type: 'ios.simulator',
          device: {
            type: 'iPhone XS',
          },
        }),
        runnerConfig: {
          runnerConfig: 'e2e/jest.config.js',
        },
        sessionConfig: expect.objectContaining({
          server: 'ws://localhost:9999',
          sessionId: 'external file works',
        }),
      });
    });
  });
});
