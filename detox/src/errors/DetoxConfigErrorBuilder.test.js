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

  describe('.noConfigurationsInside', () => {
    beforeEach(() => {
      build = () => builder.noConfigurationsInside();
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

  describe('.cantChooseConfiguration', () => {
    beforeEach(() => {
      build = () => builder.cantChooseConfiguration();
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

  describe('.noConfigurationWithGivenName', () => {
    beforeEach(() => {
      build = () => builder.noConfigurationWithGivenName();
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

  describe('.configurationShouldNotBeEmpty', () => {
    beforeEach(() => {
      build = () => builder.configurationShouldNotBeEmpty();
      builder.setConfigurationName('empty')
      builder.setDetoxConfig({
        configurations: {
          nonEmpty: { launchArgs: { key: 'value' } },
          empty: {},
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

  describe('.thereAreNoDeviceConfigs', () => {
    beforeEach(() => {
      build = () => builder.thereAreNoDeviceConfigs('simulator');
      builder.setConfigurationName('conf1')
      builder.setDetoxConfig({
        configurations: {
          conf1: {
            device: 'simulator',
          },
        },
      });
    });

    it('should create an error with a hint', () => {
      expect(build()).toMatchSnapshot('without config path');

      builder.setDetoxConfigPath('/etc/detox/config.js');
      expect(build()).toMatchSnapshot('with config path');
    });
  });

  describe('.missingDeviceMatcherProperties', () => {
    beforeEach(() => {
      build = (alias) => builder.missingDeviceMatcherProperties(alias, ['foo', 'bar']);
      builder.setConfigurationName('android.release');
      builder.setDetoxConfig({
        devices: {
          'emulator': {
            type: 'android.emulator',
          },
        },
        configurations: {
          'android.release': {
            type: 'android.emulator',
          },
        },
      });
    });

    it('should work with plain configurations', () => {
      expect(build()).toMatchSnapshot();
    });

    it('should work with aliased configurations', () => {
      delete builder.selectedConfiguration.type;
      builder.selectedConfiguration.device = 'emulator';

      expect(build('emulator')).toMatchSnapshot();
    });

    it('should include the config location into a hint message if it is known', () => {
      builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
      expect(build()).toMatchSnapshot();
    });
  });

  describe('.noAppIsDefined', () => {
    beforeEach(() => {
      build = (deviceType) => builder.noAppIsDefined(deviceType);
      builder.setConfigurationName('android.release');
    });

    it('should create same versions for device subtypes', () => {
      expect(build('ios.simulator')).toEqual(build('ios.none'));
      expect(build('android.emulator')).toEqual(build('android.attached'));
      expect(build('android.emulator')).toEqual(build('android.genycloud'));
    });

    it('should create different versions depending on device type', () => {
      expect(build('ios.simulator')).not.toEqual(build('android.emulator'));
      expect(build('ios.simulator')).not.toEqual(build('./stub/driver'));
      expect(build('android.emulator')).not.toEqual(build('./stub/driver'));
    });

    it('should produce iOS-specific error message', () => {
      expect(build('ios.simulator')).toMatchSnapshot();
    });

    it('should produce Android-specific error message', () => {
      expect(build('android.genycloud')).toMatchSnapshot();
    });

    it('should produce a custom error message for unknown device type', () => {
      expect(build('unknown')).toMatchSnapshot();
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
