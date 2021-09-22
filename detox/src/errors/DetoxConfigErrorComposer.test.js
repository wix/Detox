const fs = require('fs');
const os = require('os');

const _ = require('lodash');

const DetoxConfigErrorComposer = require('./DetoxConfigErrorComposer');

describe('DetoxConfigErrorComposer', () => {
  /** @type DetoxConfigErrorComposer */
  let builder;
  let build;
  let config;

  beforeEach(() => {
    /** @type Detox.DetoxConfig */
    config = {
      devices: {
        aDevice: {
          type: 'ios.simulator',
          device: {
            type: 'iPhone 12',
          },
        }
      },
      apps: {
        someApp: {
          type: 'ios.app',
          binaryPath: 'path/to/app',
        },
      },
      configurations: {
        plain: {
          type: 'android.emulator',
          device: 'Pixel_3a_API_30_x86',
          binaryPath: 'path/to/apk',
        },
        aliased: {
          device: 'aDevice',
          apps: ['someApp'],
        },
        inlined: {
          device: null,
          app: null,
        },
        inlinedMulti: {
          device: null,
          apps: [],
        },
      },
    };

    config.configurations.inlined.device = { ...config.devices.aDevice };
    config.configurations.inlined.app = { ...config.apps.someApp };
    config.configurations.inlinedMulti.device = { ...config.devices.aDevice };
    config.configurations.inlinedMulti.apps = [{ ...config.apps.someApp }];

    builder = new DetoxConfigErrorComposer()
      .setDetoxConfigPath('/home/detox/myproject/.detoxrc.json')
      .setDetoxConfig(config);
  });

  describe('(from configuration/index)', () => {
    describe('.noConfigurationSpecified', () => {
      beforeEach(() => {
        build = () => builder.noConfigurationSpecified();
      });

      it('should create error 1, if the configuration file is not package.json', () => {
        builder.setDetoxConfigPath('somethingElse');
        expect(build()).toMatchSnapshot();
      });

      it('should create error 2, if the configuration file is package.json', () => {
        builder.setDetoxConfigPath('/home/detox/myproject/package.json');
        expect(build()).toMatchSnapshot();
      });
    });

    describe('.noConfigurationAtGivenPath', () => {
      it('should create an error with the attempted config path', () => {
        expect(builder.noConfigurationAtGivenPath('./some/detox-config.js')).toMatchSnapshot();
      });

      it('should create an error with the attempted "extends" path', () => {
        expect(
          builder
            .setExtends(true)
            .setDetoxConfigPath('package.json')
            .noConfigurationAtGivenPath('some-detox-preset')
        ).toMatchSnapshot();
      });
    });

    describe('.failedToReadConfiguration', () => {
      it('should create a generic error, if I/O error is unknown', () => {
        expect(builder.failedToReadConfiguration()).toMatchSnapshot();
      });

      it('should create a simple error, but with the original intercepted IO error', () => {
        const ioError = _.attempt(() => fs.readFileSync(os.homedir()));
        delete ioError.stack;
        expect(builder.failedToReadConfiguration(ioError)).toMatchSnapshot();
      });
    });

    describe('.noConfigurationsInside', () => {
      beforeEach(() => {
        config.configurations = {};
        build = () => builder.noConfigurationsInside();
      });

      it('should create a generic error if all is unknown', () => {
        builder.setDetoxConfig(null);
        builder.setDetoxConfigPath('');

        expect(build()).toMatchSnapshot();
      });

      it('should create an error with Detox config fragment, if the path is not known', () => {
        builder.setDetoxConfigPath('');
        expect(build()).toMatchSnapshot();
      });

      it('should create an error with Detox config location hint, if it is known', () => {
        expect(build()).toMatchSnapshot();
      });
    });

    describe('.cantChooseConfiguration', () => {
      beforeEach(() => {
        build = () => builder.cantChooseConfiguration();
      });

      it('should create an error with --configuration suggestions', () => {
        builder.setDetoxConfigPath('/etc/detox/config.js');
        expect(build()).toMatchSnapshot();
      });
    });

    describe('.noConfigurationWithGivenName', () => {
      beforeEach(() => {
        build = () => builder.noConfigurationWithGivenName();
        builder.setConfigurationName('otherConf');
      });

      it('should create an error with configuration suggestions', () => {
        expect(build()).toMatchSnapshot();
      });
    });

    describe('.configurationShouldNotBeEmpty', () => {
      beforeEach(() => {
        build = () => builder.configurationShouldNotBeEmpty();
        builder.setConfigurationName('empty');
        config.configurations.empty = {};
      });

      it('should create a helpful error', () => {
        expect(build()).toMatchSnapshot();
      });
    });
  });

  describe('(from composeDeviceConfig)', () => {
    describe('.thereAreNoDeviceConfigs', () => {
      beforeEach(() => {
        build = () => builder.thereAreNoDeviceConfigs('aDevice');
        config.devices = {};
        builder.setConfigurationName('aliased');
      });

      it('should create an error with a hint', () => {
        expect(build()).toMatchSnapshot();
      });
    });

    describe('.cantResolveDeviceAlias', () => {
      it('should create a helpful error', () => {
        builder.setConfigurationName('aliased');
        expect(builder.cantResolveDeviceAlias('otherDevice')).toMatchSnapshot();
      });
    });

    describe('.malformedDeviceProperty', () => {
      test.each([
        ['bootArgs', 'inlined', ['--arg']],
        ['bootArgs', 'aliased', ['--arg']],
        ['forceAdbInstall', 'inlined', 'true'],
        ['forceAdbInstall', 'aliased', 'false'],
        ['gpuMode', 'inlined', 'something_odd'],
        ['gpuMode', 'aliased', true],
        ['headless', 'inlined', 'non-boolean'],
        ['headless', 'aliased', 'non-boolean'],
        ['readonly', 'inlined', 'non-boolean'],
        ['readonly', 'aliased', 'non-boolean'],
        ['utilBinaryPaths', 'plain', 'invalid'],
        ['utilBinaryPaths', 'inlined', [NaN, 'valid']],
        ['utilBinaryPaths', 'aliased', [NaN, 'valid']],
      ])('(%j) should create an error for %s configuration', (propertyName, configurationType, invalidValue) => {
        builder.setConfigurationName(configurationType);
        const deviceAlias = configurationType === 'aliased' ? 'aDevice' : undefined;
        const deviceConfig = configurationType === 'plain'
          ? config.configurations[configurationType]
          : configurationType === 'inlined'
            ? config.configurations[configurationType].device
            : config.devices.aDevice;

        deviceConfig[propertyName] = invalidValue;
        expect(builder.malformedDeviceProperty(deviceAlias, propertyName)).toMatchSnapshot();
      });

      it('should throw on an unknown argument', () => {
        expect(() => builder.malformedDeviceProperty(undefined, 'unknown')).toThrowErrorMatchingSnapshot();
      });
    });

    describe('.unsupportedDeviceProperty', () => {
      test.each([
        ['bootArgs', 'inlined', '--no-window'],
        ['bootArgs', 'aliased', '--no-window'],
        ['forceAdbInstall', 'inlined', true],
        ['forceAdbInstall', 'aliased', false],
        ['gpuMode', 'inlined', 'auto'],
        ['gpuMode', 'aliased', 'auto'],
        ['headless', 'inlined', true],
        ['headless', 'aliased', true],
        ['readonly', 'inlined', false],
        ['readonly', 'aliased', false],
        ['utilBinaryPaths', 'plain', []],
        ['utilBinaryPaths', 'inlined', []],
        ['utilBinaryPaths', 'aliased', []],
      ])('(%j) should create an error for %s configuration', (propertyName, configurationType, invalidValue) => {
        builder.setConfigurationName(configurationType);
        const deviceAlias = configurationType === 'aliased' ? 'aDevice' : undefined;
        const deviceConfig = configurationType === 'plain'
          ? config.configurations[configurationType]
          : configurationType === 'inlined'
            ? config.configurations[configurationType].device
            : config.devices.aDevice;

        deviceConfig[propertyName] = invalidValue;
        expect(builder.unsupportedDeviceProperty(deviceAlias, propertyName)).toMatchSnapshot();
      });

      it('should throw on an unknown argument', () => {
        expect(() => builder.unsupportedDeviceProperty(undefined, 'unknown')).toThrowErrorMatchingSnapshot();
      });
    });

    describe('.deviceConfigIsUndefined', () => {
      beforeEach(() => {
        build = () => builder.deviceConfigIsUndefined();
      });

      it('should produce a helpful error', () => {
        builder.setConfigurationName('plain');
        expect(build()).toMatchSnapshot();
      });
    });

    describe('.missingDeviceType', () => {
      beforeEach(() => {
        build = (alias) => builder.missingDeviceType(alias);
      });

      it('should create an error for inlined configuration', () => {
        delete config.configurations.inlined.device.type;
        builder.setConfigurationName('inlined');
        expect(build()).toMatchSnapshot();
      });

      it('should create an error for aliased configuration', () => {
        delete config.devices.aDevice.type;
        builder.setConfigurationName('aliased');
        expect(build('aDevice')).toMatchSnapshot();
      });
    });

    describe('.invalidDeviceType', () => {
      beforeEach(() => {
        build = (deviceConfig, alias) => {
          // eslint-disable-next-line node/no-missing-require
          const err = _.attempt(() => require('android.apk'));
          return builder.invalidDeviceType(alias, deviceConfig, err);
        };
      });

      it('should create an error for inlined configuration', () => {
        const deviceConfig = config.configurations.inlined.device;
        deviceConfig.type = 'android.apk';
        builder.setConfigurationName('inlined');
        expect(build(deviceConfig)).toMatchSnapshot();
      });

      it('should create an error for aliased configuration', () => {
        const deviceConfig = config.devices.aDevice;
        deviceConfig.type = 'android.apk';
        builder.setConfigurationName('aliased');
        expect(build(deviceConfig, 'aDevice')).toMatchSnapshot();
      });
    });

    describe('.missingDeviceMatcherProperties', () => {
      beforeEach(() => {
        build = (alias) => builder.missingDeviceMatcherProperties(alias, ['foo', 'bar']);
      });

      it('should work with plain configurations', () => {
        builder.setConfigurationName('plain');
        expect(build()).toMatchSnapshot();
      });

      it('should work with inlined configurations', () => {
        builder.setConfigurationName('inlined');
        expect(build()).toMatchSnapshot();
      });

      it('should work with aliased configurations', () => {
        builder.setConfigurationName('aliased');
        expect(build('aDevice')).toMatchSnapshot();
      });
    });
  });

  describe('(from composeAppsConfig)', () => {
    describe('.thereAreNoAppConfigs', () => {
      it('should create an error for aliased configuration', () => {
        delete config.apps.someApp;
        builder.setConfigurationName('aliased');

        expect(builder.thereAreNoAppConfigs('someApp')).toMatchSnapshot();
      });
    });

    describe('.cantResolveAppAlias', () => {
      it('should create an error for aliased configuration', () => {
        builder.setConfigurationName('aliased');
        expect(builder.cantResolveAppAlias('anotherApp')).toMatchSnapshot();
      });
    });

    describe('.appConfigIsUndefined', () => {
      beforeEach(() => {
        build = (appPath) => builder.appConfigIsUndefined(appPath);
        builder.setConfigurationName('android.release');
      });

      it('should take into account if it is "app" missing', () => {
        expect(build(['configurations', 'android.release', 'app'])).toMatchSnapshot();
      });

      it('should take into account if it is "apps" array has an empty element', () => {
        expect(build(['configurations', 'android.release', 'apps', 0])).toMatchSnapshot();
      });
    });

    describe('.malformedAppLaunchArgs', () => {
      beforeEach(() => {
        build = (appPath) => builder.malformedAppLaunchArgs(appPath);
      });

      it('should work with plain configurations', () => {
        config.configurations.plain.launchArgs = 'invalid';
        builder.setConfigurationName('plain');
        expect(build(['configurations', 'plain'])).toMatchSnapshot();
      });

      it('should work with inlined configurations', () => {
        config.configurations.inlinedMulti.apps[0].launchArgs = 'invalid';
        builder.setConfigurationName('inlinedMulti');
        expect(build(['configurations', 'inlinedMulti', 'apps', 0])).toMatchSnapshot();
      });

      it('should work with aliased configurations', () => {
        config.apps.someApp.launchArgs = 'invalid';
        builder.setConfigurationName('aliased');
        expect(build(['apps', 'someApp'])).toMatchSnapshot();
      });
    });

    describe('.missingAppBinaryPath', () => {
      beforeEach(() => {
        build = (appPath) => builder.missingAppBinaryPath(appPath);
      });

      it('should create an error for plain configuration', () => {
        builder.setConfigurationName('plain');
        delete config.configurations.plain.binaryPath;
        expect(build(['configurations', 'plain'])).toMatchSnapshot();
      });

      it('should create an error for aliased configuration', () => {
        builder.setConfigurationName('aliased');
        delete config.apps.someApp.binaryPath;
        expect(build(['apps', 'someApp'])).toMatchSnapshot();
      });

      it('should create an error for inlined configuration', () => {
        builder.setConfigurationName('inlined');
        delete config.configurations.inlined.app.binaryPath;
        expect(build(['configurations', 'inlined', 'app'])).toMatchSnapshot();
      });

      it('should create an error for inlined multi-app configuration', () => {
        builder.setConfigurationName('inlinedMulti');
        delete config.configurations.inlinedMulti.apps[0].binaryPath;
        expect(build(['configurations', 'inlined', 'apps', 0])).toMatchSnapshot();
      });
    });

    describe('.invalidAppType', () => {
      beforeEach(() => {
        build = (appPath) => builder.invalidAppType(appPath);
      });

      it('should create an error for aliased configuration', () => {
        builder.setConfigurationName('aliased');
        config.apps.someApp.type = 'invalid.app';
        expect(build({
          appPath: ['apps', 'someApp'],
          allowedAppTypes: ['ios.app'],
          deviceType: 'ios.simulator',
        })).toMatchSnapshot();
      });

      it('should create an error for inlined configuration', () => {
        builder.setConfigurationName('inlinedMulti');
        config.configurations.inlinedMulti.apps[0].type = 'invalid.app';
        expect(build({
          appPath: ['configurations', 'inlinedMulti', 'apps', 0],
          allowedAppTypes: ['ios.app'],
          deviceType: 'ios.simulator',
        })).toMatchSnapshot();
      });
    });

    describe('.duplicateAppConfig', () => {
      beforeEach(() => {
        build = (args) => builder.duplicateAppConfig(args);
        config.apps.otherApp = { ...config.apps.someApp };
      });

      it('should help with aliased non-named apps', () => {
        builder.setConfigurationName('aliased');
        config.configurations.aliased.apps.push('otherApp');
        expect(build({
          appName: undefined,
          appPath: ['apps', 'otherApp'],
          preExistingAppPath: ['apps', 'someApp'],
        })).toMatchSnapshot();
      });

      it('should help with aliased named apps', () => {
        builder.setConfigurationName('aliased');
        config.configurations.aliased.apps.push('otherApp');
        config.apps.someApp.name = config.apps.otherApp.name = 'TheApp';
        expect(build({
          appName: 'TheApp',
          appPath: ['apps', 'otherApp'],
          preExistingAppPath: ['apps', 'someApp'],
        })).toMatchSnapshot();
      });

      it('should help with inlined non-named apps', () => {
        builder.setConfigurationName('inlinedMulti');
        config.configurations.inlinedMulti.apps.push({
          ...config.apps.otherApp,
        });

        expect(build({
          appName: undefined,
          appPath: ['configurations', 'inlinedMulti', 'apps', 1],
          preExistingAppPath: ['configurations', 'inlinedMulti', 'apps', 0],
        })).toMatchSnapshot();
      });

      it('should help with inlined named apps', () => {
        builder.setConfigurationName('inlinedMulti');
        config.configurations.inlinedMulti.apps.push({
          ...config.apps.otherApp,
        });
        config.configurations.inlinedMulti.apps.forEach(a => {
          a.name = 'TheApp';
        });

        expect(build({
          appName: 'TheApp',
          appPath: ['configurations', 'inlinedMulti', 'apps', 1],
          preExistingAppPath: ['configurations', 'inlinedMulti', 'apps', 0],
        })).toMatchSnapshot();
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

    describe('.oldSchemaHasAppAndApps', () => {
      beforeEach(() => {
        build = () => builder.oldSchemaHasAppAndApps();
      });

      it('should create an error for ambigous old/new configuration if it has .apps', () => {
        builder.setConfigurationName('plain');
        config.configurations.plain.app = 'my-app';

        expect(build()).toMatchSnapshot();
      });
    });

    describe('.ambiguousAppAndApps', () => {
      beforeEach(() => {
        build = () => builder.ambiguousAppAndApps();
      });

      it('should create an error for aliased configuration', () => {
        builder.setConfigurationName('aliased');
        config.configurations.aliased.app = config.configurations.aliased.apps[0];

        expect(build()).toMatchSnapshot();
      });

      it('should create an error for inlined configuration', () => {
        builder.setConfigurationName('inlinedMulti');
        config.configurations.inlinedMulti.app = {
          ...config.configurations.inlinedMulti.apps[0]
        };

        expect(build()).toMatchSnapshot();
      });
    });

    describe('.multipleAppsConfigArrayTypo', () => {
      beforeEach(() => {
        build = () => builder.multipleAppsConfigArrayTypo();
      });

      it('should create an error for aliased configuration', () => {
        builder.setConfigurationName('aliased');
        config.configurations.aliased.app = config.configurations.aliased.apps;
        delete config.configurations.aliased.apps;

        expect(build()).toMatchSnapshot();
      });

      it('should create an error for inlined configuration', () => {
        builder.setConfigurationName('inlinedMulti');
        config.configurations.inlinedMulti.app = config.configurations.inlinedMulti.apps;
        delete config.configurations.inlinedMulti.apps;

        expect(build()).toMatchSnapshot();
      });
    });

    describe('.multipleAppsConfigShouldBeArray', () => {
      beforeEach(() => {
        build = () => builder.multipleAppsConfigShouldBeArray();
      });

      it('should create an error for aliased configuration', () => {
        builder.setConfigurationName('aliased');
        config.configurations.aliased.apps = config.configurations.aliased.apps[0];

        expect(build()).toMatchSnapshot();
      });

      it('should create an error for inlined configuration', () => {
        builder.setConfigurationName('inlinedMulti');
        config.configurations.inlinedMulti.apps = config.configurations.inlinedMulti.apps[0];

        expect(build()).toMatchSnapshot();
      });
    });
  });

  describe('(from composeSessionConfig)', () => {
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
        });

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
        });

        builder.setDetoxConfigPath('/home/detox/myproject/.detoxrc.json');
        expect(build()).toMatchSnapshot();
      });
    });
  });

  describe('(from local-cli/build)', () => {
    it('should create a generic error, if the config location is not known', () => {
      delete config.apps.someApp.build;
      builder.setConfigurationName('aliased');
      expect(builder.missingBuildScript(config.apps.someApp)).toMatchSnapshot();
    });
  });
});
