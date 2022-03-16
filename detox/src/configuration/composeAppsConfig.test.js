// @ts-nocheck
const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');

const {
  appWithAbsoluteBinaryPath,
  appWithRelativeBinaryPath,
} = require('./configurations.mock');

describe('composeAppsConfig', () => {
  let composeAppsConfig;

  /** @type {*} */
  let cliConfig;
  /** @type {string} */
  let configurationName;
  /** @type {Detox.DetoxDeviceConfig} */
  let deviceConfig;
  /** @type {Detox.DetoxConfiguration} */
  let localConfig;
  /** @type {Detox.DetoxConfig} */
  let globalConfig;
  /** @type {DetoxConfigErrorComposer} */
  let errorComposer;

  beforeEach(() => {
    composeAppsConfig = require('./composeAppsConfig');
    cliConfig = {};
    localConfig = {};
    deviceConfig = { device: 'someMatcher' };
    configurationName = 'someConfig';
    globalConfig = {
      configurations: {
        [configurationName]: localConfig,
      },
    };

    errorComposer = new DetoxConfigErrorComposer()
      .setDetoxConfig(globalConfig)
      .setConfigurationName(configurationName);
  });

  const compose = () => composeAppsConfig({
    errorComposer,
    configurationName,
    globalConfig,
    localConfig,
    deviceConfig,
    cliConfig,
  });

  describe('given a plain configuration', () => {
    beforeEach(() => {
      localConfig = {
        type: 'ios.simulator',
        device: 'Phone',
        binaryPath: 'path/to/app',
        bundleId: 'com.example.app',
        build: 'echo OK',
        launchArgs: {
          hello: 'world',
        }
      };
    });

    it.each([
      ['ios.none', 'ios.app'],
      ['ios.simulator', 'ios.app'],
      ['android.attached', 'android.apk'],
      ['android.emulator', 'android.apk'],
      ['android.genycloud', 'android.apk'],
    ])('should infer type and app properties for %j', (deviceType, appType) => {
      deviceConfig.type = deviceType;
      expect(compose()).toEqual({
        default: {
          ...localConfig,
          type: appType,
          device: undefined,
        },
      });
    });

    it('should take it as-is for unknown device type', () => {
      deviceConfig.type = './customDriver';
      localConfig = { ...deviceConfig };
      expect(compose()).toEqual({
        default: localConfig
      });
    });

    it('should ignore mistyped Android properties for iOS app', () => {
      deviceConfig.type = 'ios.simulator';
      localConfig.testBinaryPath = 'somePath';

      const appConfig = compose().default;
      expect(appConfig.testBinaryPath).toBe(undefined);
    });

    it('should include Android properties for Android app', () => {
      deviceConfig.type = 'android.emulator';
      localConfig.testBinaryPath = 'somePath';

      const appConfig = compose().default;
      expect(appConfig.testBinaryPath).toBe('somePath');
    });

    it.each([
      ['ios.none'],
      ['ios.simulator'],
      ['android.attached'],
      ['android.emulator'],
      ['android.genycloud'],
    ])('should ignore non-recognized properties for %j', (deviceType) => {
      deviceConfig.type = deviceType;
      localConfig.testBinaryPath2 = 'somePath';
      expect(compose().default.testBinaryPath2).toBe(undefined);
    });

    describe('.launchArgs', () => {
      it('when it it is a string, should throw', () => {
        localConfig.launchArgs = '-detoxAppArgument NO';
        expect(compose).toThrowError(errorComposer.malformedAppLaunchArgs(['configurations', configurationName]));
      });

      it('when it is an object with nullish properties, it should omit them', () => {
        localConfig.launchArgs.nully = null;
        localConfig.launchArgs.undefiny = undefined;
        localConfig.launchArgs.aString = 'proveYourself';
        localConfig.launchArgs.anObject = { a: 1 };
        localConfig.launchArgs.anInteger = 2;

        expect(compose().default.launchArgs).toEqual({
          hello: 'world',
          aString: 'proveYourself',
          anInteger: 2,
          anObject: { a: 1 },
        });
      });
    });

    describe('given an unknown device type', () => {
      it('should transfer the config as-is, for backward compatibility', () => {
        deviceConfig.type = './myDriver';
        expect(compose()).toEqual({ default: localConfig });
      });
    });
  });

  describe('given a configuration with single app', () => {
    beforeEach(() => {
      deviceConfig.type = 'ios.simulator';
      globalConfig.apps = {
        example1: appWithAbsoluteBinaryPath,
        example2: appWithRelativeBinaryPath,
      };
    });

    describe('when the app is aliased', () => {
      beforeEach(() => {
        localConfig.app = 'example1';
      });

      it('should resolve the alias and extract the app config', () => {
        expect(compose()).toEqual({
          default: globalConfig.apps.example1
        });
      });
    });

    describe('when the app is inlined', () => {
      beforeEach(() => {
        localConfig.app = { ...globalConfig.apps.example2 };
      });

      it('should resolve the alias and extract the app config', () => {
        expect(compose()).toEqual({
          default: globalConfig.apps.example2,
        });
      });
    });
  });

  describe('given a configuration with multiple apps', () => {
    beforeEach(() => {
      deviceConfig.type = 'ios.simulator';
      globalConfig.apps = {
        example1: { ...appWithAbsoluteBinaryPath, name: 'app1' },
        example2: { ...appWithRelativeBinaryPath, name: 'app2' },
      };
    });

    describe('when the apps are aliased', () => {
      beforeEach(() => {
        localConfig.apps = ['example1', 'example2'];
      });

      it('should resolve the alias and extract the app config', () => {
        expect(compose()).toEqual({
          app1: globalConfig.apps.example1,
          app2: globalConfig.apps.example2,
        });
      });

      describe('and there is a CLI override', () => {
        beforeEach(() => {
          globalConfig.apps.example2.launchArgs = {
            arg1: 'value1',
            arg2: 'value2',
            arg3: 'value3',
          };

          cliConfig.appLaunchArgs = '--no-arg2 -arg3=override';
        });

        it('should parse it and merge the values inside', () => {
          const { app1, app2 } = compose();

          expect(app1.launchArgs).toEqual({ arg3: 'override' });
          expect(app2.launchArgs).toEqual({ arg1: 'value1', arg3: 'override' });
        });
      });
    });

    describe('when the apps are inlined', () => {
      beforeEach(() => {
        localConfig.apps = [
          { ...globalConfig.apps.example1 },
          { ...globalConfig.apps.example2 },
        ];
      });

      it('should resolve the alias and extract the app config', () => {
        expect(compose()).toEqual({
          app1: globalConfig.apps.example1,
          app2: globalConfig.apps.example2,
        });
      });
    });
  });

  describe('unhappy scenarios:', () => {
    describe('plain configuration:', () => {
      beforeEach(() => {
        localConfig = {
          type: 'ios.simulator',
          device: 'Phone',
          binaryPath: 'path/to/app',
          bundleId: 'com.example.app',
          build: 'echo OK',
          launchArgs: {
            hello: 'world',
          }
        };
      });

      it('should throw if the config has .app property defined', () => {
        localConfig.app = 'myapp';
        expect(compose).toThrowError(errorComposer.oldSchemaHasAppAndApps());
      });

      it('should throw if the config has .apps property defined', () => {
        localConfig.apps = ['myapp'];
        expect(compose).toThrowError(errorComposer.oldSchemaHasAppAndApps());
      });
    });

    describe('aliased configuration:', () => {
      beforeEach(() => {
        globalConfig.apps = {
          example1: appWithAbsoluteBinaryPath,
          example2: appWithRelativeBinaryPath,
        };

        delete localConfig.type;
      });

      test.each([
        ['ios.simulator'],
        ['android.emulator'],
        ['./stub/driver'],
      ])('no app/apps is defined when device is %s', (deviceType) => {
        delete localConfig.app;
        delete localConfig.apps;
        deviceConfig.type = deviceType;

        expect(compose).toThrowError(errorComposer.noAppIsDefined(deviceType));
      });

      test('both app/apps are defined', () => {
        localConfig.app = 'example1';
        localConfig.apps = ['example1', 'example2'];

        expect(compose).toThrowError(errorComposer.ambiguousAppAndApps());
      });

      test('app is defined as an array', () => {
        localConfig.app = ['example1', 'example2'];

        expect(compose).toThrowError(errorComposer.multipleAppsConfigArrayTypo());
      });

      test('apps are defined as a string', () => {
        localConfig.apps = 'example1';

        expect(compose).toThrowError(errorComposer.multipleAppsConfigShouldBeArray());
      });

      test('"apps" dictionary is undefined', () => {
        delete globalConfig.apps;
        localConfig.app = 'example1';

        expect(compose).toThrowError(errorComposer.thereAreNoAppConfigs('example1'));
      });

      test('non-existent app, cannot resolve alias', () => {
        localConfig.app = 'elbereth';

        expect(compose).toThrowError(errorComposer.cantResolveAppAlias('elbereth'));
      });

      test('undefined inline app', () => {
        localConfig.apps = ['example1', null];

        expect(compose).toThrowError(
          errorComposer.appConfigIsUndefined(['configurations', configurationName, 'apps', 1])
        );
      });

      test('apps have no name (collision)', () => {
        localConfig.apps = ['example1', 'example2'];

        expect(compose).toThrowError(errorComposer.duplicateAppConfig({
          appName: undefined,
          appPath: ['apps', 'example2'],
          preExistingAppPath: ['apps', 'example1'],
        }));
      });

      test('apps have the same name (collision)', () => {
        globalConfig.apps.example1.name = 'sameApp';
        globalConfig.apps.example2.name = 'sameApp';
        localConfig.apps = ['example1', 'example2'];

        expect(compose).toThrowError(errorComposer.duplicateAppConfig({
          appName: 'sameApp',
          appPath: ['apps', 'example2'],
          preExistingAppPath: ['apps', 'example1'],
        }));
      });

      test.each([
        ['ios.app', 'ios.none'],
        ['ios.app', 'ios.simulator'],
        ['android.apk', 'android.attached'],
        ['android.apk', 'android.emulator'],
        ['android.apk', 'android.genycloud'],
      ])('known app (device type = %s) has no binaryPath', (appType, deviceType) => {
        delete globalConfig.apps.example1.binaryPath;
        globalConfig.apps.example1.type = appType;
        deviceConfig.type = deviceType;
        localConfig.app = 'example1';

        expect(compose).toThrowError(errorComposer.missingAppBinaryPath(
          ['apps', 'example1']
        ));
      });

      test.each([
        ['android.apk', 'ios.none'],
        ['android.apk', 'ios.simulator'],
        ['ios.app', 'android.attached'],
        ['ios.app', 'android.emulator'],
        ['ios.app', 'android.genycloud'],
      ])('app type (%s) is incompatible with device (%s)', (appType, deviceType) => {
        localConfig.app = 'example1';
        globalConfig.apps.example1.type = appType;
        deviceConfig.type = deviceType;

        expect(compose).toThrowError(
          errorComposer.invalidAppType({
            appPath: ['apps', 'example1'],
            allowedAppTypes: [appType === 'android.apk' ? 'ios.app' : 'android.apk'],
            deviceType,
          })
        );
      });
    });
  });
});
