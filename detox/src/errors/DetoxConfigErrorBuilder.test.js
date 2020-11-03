const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const DetoxConfigErrorBuilder = require('./DetoxConfigErrorBuilder');

describe('DetoxConfigErrorBuilder', () => {
  /** @type DetoxConfigErrorBuilder */
  let builder;
  let build;

  beforeEach(() => {
    builder = new DetoxConfigErrorBuilder();
  });

  describe('.noConfigurationSpecified', () => {
    beforeEach(() => {
      build = () => builder.noConfigurationSpecified();
    });

    it('should create a generic error, if the configuration file is unknown', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create a generic error, if the configuration file is not a package.json', () => {
      builder.setDetoxConfigPath('detox.config.json');
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a package.json hint, if THAT is the configuration file', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/package.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.noConfigurationAtGivenPath', () => {
    beforeEach(() => {
      build = () => builder.noConfigurationAtGivenPath();
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
    });

    it('should create an error with the attempted config path', () => {
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.failedToReadConfiguration', () => {
    it('should create a generic error, if I/O error is unknown', () => {
      builder.setDetoxConfigPath('/etc/detox/config.js');
      expect(builder.failedToReadConfiguration()).toMatchSnapshot();
    });

    it('should create a simple error, but with the original intercepted IO error', () => {
      const ioError = _.attempt(() => fs.readFileSync(os.homedir()));
      builder.setDetoxConfigPath('/home/detox');
      expect(builder.failedToReadConfiguration(ioError)).toMatchSnapshot();
    });
  });

  describe('.noDeviceConfigurationsInside', () => {
    beforeEach(() => {
      build = () => builder.noDeviceConfigurationsInside();
    });

    it('should create a generic error if all is unknown', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with Detox config fragment, if the path is not known', () => {
      builder.setDetoxConfig({ config: { ios: {}, android: {} } });
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with Detox config location hint, if it is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      builder.setDetoxConfig({});

      expect(build()).toMatchSnapshot();
    });
  });

  describe('.cantChooseDeviceConfiguration', () => {
    beforeEach(() => {
      build = () => builder.cantChooseDeviceConfiguration();
      builder.setDetoxConfig({
        configurations: {
          conf1: {},
          conf2: {},
        },
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/etc/detox/config.js');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.noDeviceConfigurationWithGivenName', () => {
    beforeEach(() => {
      build = () => builder.noDeviceConfigurationWithGivenName();
      builder.setConfigurationName('otherConf')
      builder.setDetoxConfig({
        configurations: {
          conf1: {},
        },
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/etc/detox/config.js');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.missingConfigurationType', () => {
    beforeEach(() => {
      build = () => builder.missingConfigurationType();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            device: 'Nexus 5',
          },
        },
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.malformedAppLaunchArgs', () => {
    beforeEach(() => {
      build = () => builder.malformedAppLaunchArgs();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
            utilBinaryPaths: '/valid/path/outside/of/array',
            device: 'Pixel 4',
            launchArgs: 'do not use strings here please',
          },
        },
      });
    });

    it('should create an error with specifying the config name', () => {
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.malformedAppLaunchArgsProperty', () => {
    beforeEach(() => {
      build = () => builder.malformedAppLaunchArgsProperty('invalidFalseProperty');
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
            utilBinaryPaths: '/valid/path/outside/of/array',
            device: 'Pixel 4',
            launchArgs: {
              validFalseProperty: 'false',
              invalidFalseProperty: false,
            },
          },
        },
      });
    });

    it('should create an error with specifying the exact launch arg', () => {
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.malformedUtilBinaryPaths', () => {
    beforeEach(() => {
      build = () => builder.malformedUtilBinaryPaths()
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
            utilBinaryPaths: '/valid/path/outside/of/array',
            device: 'Pixel 4',
          },
        },
      });
    });

    it('should create an error with specifying the config name', () => {
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.missingDeviceProperty', () => {
    beforeEach(() => {
      build = () => builder.missingDeviceProperty();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
          },
        },
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.missingBuildScript', () => {
    beforeEach(() => {
      build = () => builder.missingBuildScript();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
            device: {
              avdName: 'Pixel_2_API_29'
            }
          }
        }
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.invalidServerProperty', () => {
    beforeEach(() => {
      build = () => builder.invalidServerProperty();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        session: {
          server: 'localhost',
        },
        configurations: {
          'android.release': {
            type: 'android.emulator',
            device: {
              avdName: 'Pixel_2_API_29'
            }
          }
        }
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.invalidSessionId', () => {
    beforeEach(() => {
      build = () => builder.invalidSessionIdProperty();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
            device: {
              avdName: 'Pixel_2_API_29',
            },
            session: {
              sessionId: 234589798234,
            },
          }
        }
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });

    it('should point to global session if there is one', () => {
      builder.setDetoxConfig({
        session: {
          server: 'ws://localhost:12837',
        },
        configurations: {},
      })

      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.invalidDebugSynchronizationProperty', () => {
    beforeEach(() => {
      build = () => builder.invalidDebugSynchronizationProperty();
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        configurations: {
          'android.release': {
            type: 'android.emulator',
            device: {
              avdName: 'Pixel_2_API_29',
            },
            session: {
              debugSynchronization: '3000',
            },
          }
        }
      });
    });

    it('should create a generic error, if the config location is not known', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should create an error with a hint, if the config location is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });

    it('should point to global session if there is one', () => {
      builder.setDetoxConfig({
        session: {
          server: 'ws://localhost:12837',
        },
        configurations: {},
      })

      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });
});
