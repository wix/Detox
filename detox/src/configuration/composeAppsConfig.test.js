const _ = require('lodash');
const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');
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
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;

  beforeEach(() => {
    errorBuilder = new DetoxConfigErrorBuilder();
    composeAppsConfig = require('./composeAppsConfig');
    cliConfig = {};
    localConfig = {};
    deviceConfig = { device: 'someMatcher' };
    configurationName = 'someConfig';

    globalConfig = {
      configurations: {
        [configurationName]: localConfig,
      },
    }
  });

  const compose = () => composeAppsConfig({
    errorBuilder,
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
        '': {
          ...localConfig,
          type: appType,
          device: undefined,
        },
      });
    });

    it('should take it as-is for unknown device type', () => {
      deviceConfig.type = './customDriver';
      expect(compose()).toEqual({
        '': localConfig
      });
    });

    it('should ignore mistyped Android properties for iOS app', () => {
      deviceConfig.type = 'ios.simulator';
      localConfig.testBinaryPath = 'somePath';
      localConfig.utilBinaryPaths = ['someOther'];

      const appConfig = compose()[''];
      expect(appConfig.testBinaryPath).toBe(undefined);
      expect(appConfig.utilBinaryPaths).toBe(undefined);
    });

    it('should include Android properties for Android app', () => {
      deviceConfig.type = 'android.emulator';
      localConfig.testBinaryPath = 'somePath';
      localConfig.utilBinaryPaths = ['someOther'];

      const appConfig = compose()[''];
      expect(appConfig.testBinaryPath).toBe('somePath');
      expect(appConfig.utilBinaryPaths).toEqual(['someOther']);
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
      expect(compose()[''].testBinaryPath2).toBe(undefined);
    });

    describe('.launchArgs', () => {
      it('when it it is a string, should throw', () => {
        localConfig.launchArgs = '-detoxAppArgument NO';
        expect(compose).toThrowError(errorBuilder.malformedAppLaunchArgs(['configurations', configurationName]));
      });

      it('when it has a nullish property, should omit it', () => {
        localConfig.launchArgs.nully = null;
        localConfig.launchArgs.undefiny = undefined;
        localConfig.launchArgs.nonNully = 'proveYourself';

        expect(compose()[''].launchArgs).toEqual({
          hello: 'world',
          nonNully: 'proveYourself',
        });
      });

      it('when it has a non-nullish and non-string property', () => {
        localConfig.launchArgs = { debugSomething: false };
        expect(compose).toThrowError(errorBuilder.malformedAppLaunchArgsProperty([
          'configurations', configurationName, 'launchArgs', 'debugSomething'
        ]));
      });
    });

    describe('.utilBinaryPaths', () => {
      it('should throw if util-binary paths are malformed', () => {
        localConfig.utilBinaryPaths = 'valid/path/not/in/array';
        expect(compose).toThrowError(
          errorBuilder.malformedUtilBinaryPaths(['configurations', configurationName])
        );
      });
    });

    describe('given an unknown device type', () => {
      it('should transfer the config as-is, for backward compatibility', () => {
        deviceConfig.type = './myDriver';
        expect(compose()).toEqual({ '': localConfig });
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
          '': globalConfig.apps.example1
        });
      });
    });

    describe('when the app is inlined', () => {
      beforeEach(() => {
        localConfig.app = { ...globalConfig.apps.example2 };
      });

      it('should resolve the alias and extract the app config', () => {
        expect(compose()).toEqual({
          '': globalConfig.apps.example2,
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

          expect(app1.launchArgs).toEqual({ arg3: 'override'});
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
    describe('aliased configuration:', () => {
      beforeEach(() => {
        globalConfig.apps = {
          example1: appWithAbsoluteBinaryPath,
          example2: appWithRelativeBinaryPath,
        };

        delete localConfig.type;
      });

      test('no app/apps is defined', () => {
        delete localConfig.app;
        delete localConfig.apps;

        expect(compose).toThrowError(errorBuilder.noAppIsDefined());
      });

      test('both app/apps are defined', () => {
        localConfig.app = 'example1';
        localConfig.apps = ['example1', 'example2'];

        expect(compose).toThrowError(errorBuilder.ambiguousAppAndApps());
      });

      test('app is defined as an array', () => {
        localConfig.app = ['example1', 'example2'];

        expect(compose).toThrowError(errorBuilder.multipleAppsConfigArrayTypo());
      });

      test('apps are defined as a string', () => {
        localConfig.apps = 'example1';

        expect(compose).toThrowError(errorBuilder.multipleAppsConfigShouldBeArray());
      });

      test('apps have no name (collision)', () => {
        localConfig.apps = ['example1', 'example2'];

        expect(compose).toThrowError(errorBuilder.duplicateAppConfig({
          appName: '',
          appPath: ['apps', 'example2'],
          preExistingAppPath: ['apps', 'example1'],
        }));
      });

      test('apps have the same name (collision)', () => {
        globalConfig.apps.example1.name = 'sameApp';
        globalConfig.apps.example2.name = 'sameApp';
        localConfig.apps = ['example1', 'example2'];

        expect(compose).toThrowError(errorBuilder.duplicateAppConfig({
          appName: 'sameApp',
          appPath: ['apps', 'example2'],
          preExistingAppPath: ['apps', 'example1'],
        }));
      });

      test('app has no binaryPath', () => {
        delete globalConfig.apps.example1.binaryPath;
        localConfig.app = 'example1';

        expect(compose).toThrowError(errorBuilder.missingAppBinaryPath(
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
          errorBuilder.invalidAppType(['apps', 'example1'], deviceConfig)
        );
      });

      test('app has no binaryPath', () => {
        delete globalConfig.apps.example1.binaryPath;
        localConfig.app = 'example1';

        expect(compose).toThrowError(errorBuilder.missingAppBinaryPath(
          ['apps', 'example1']
        ));
      });
    });
  });
});
