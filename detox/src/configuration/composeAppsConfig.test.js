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

      it('should resolve the alias and extract the app config', async () => {
        await expect(compose()).resolves.toEqual({
          default: globalConfig.apps.example1
        });
      });
    });

    describe('when the app is inlined', () => {
      beforeEach(() => {
        localConfig.app = { ...globalConfig.apps.example2 };
      });

      it('should resolve the alias and extract the app config', async () => {
        await expect(compose()).resolves.toEqual({
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

      it('should resolve the alias and extract the app config', async () => {
        await expect(compose()).resolves.toEqual({
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

        it('should parse it and merge the values inside', async () => {
          const { app1, app2 } = await compose();

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

      it('should resolve the alias and extract the app config', async () => {
        await expect(compose()).resolves.toEqual({
          app1: globalConfig.apps.example1,
          app2: globalConfig.apps.example2,
        });
      });
    });
  });

  describe('given a configuration with no apps', () => {
    beforeEach(() => {
      delete localConfig.app;
      delete localConfig.apps;
    });

    describe('when the device is powered by a custom driver', () => {
      beforeEach(() => {
        deviceConfig.type = './stub/driver';
      });

      it('should return an empty app config', async () => {
        await expect(compose()).resolves.toEqual({});
      });
    });
  });

  describe('unhappy scenarios:', () => {
    describe('aliased configuration:', () => {
      beforeEach(() => {
        globalConfig.apps = {
          example1: { ...appWithAbsoluteBinaryPath },
          example2: { ...appWithRelativeBinaryPath },
        };

        delete localConfig.type;
      });

      test.each([
        ['ios.simulator'],
        ['android.attached'],
        ['android.emulator'],
        ['android.genycloud'],
      ])('no app/apps is defined when device is %s', async (deviceType) => {
        delete localConfig.app;
        delete localConfig.apps;
        deviceConfig.type = deviceType;

        await expect(compose).rejects.toThrowError(errorComposer.noAppIsDefined(deviceType));
      });

      test('both app/apps are defined', async () => {
        localConfig.app = 'example1';
        localConfig.apps = ['example1', 'example2'];

        await expect(compose).rejects.toThrowError(errorComposer.ambiguousAppAndApps());
      });

      test('app is defined as an array', async () => {
        localConfig.app = ['example1', 'example2'];

        await expect(compose).rejects.toThrowError(errorComposer.multipleAppsConfigArrayTypo());
      });

      test('apps are defined as a string', async () => {
        localConfig.apps = 'example1';

        await expect(compose).rejects.toThrowError(errorComposer.multipleAppsConfigShouldBeArray());
      });

      test('"apps" dictionary is undefined', async () => {
        delete globalConfig.apps;
        localConfig.app = 'example1';

        await expect(compose).rejects.toThrowError(errorComposer.thereAreNoAppConfigs('example1'));
      });

      test('non-existent app, cannot resolve alias', async () => {
        localConfig.app = 'elbereth';

        await expect(compose).rejects.toThrowError(errorComposer.cantResolveAppAlias('elbereth'));
      });

      test('undefined inline app', async () => {
        localConfig.apps = ['example1', null];

        await expect(compose).rejects.toThrowError(
          errorComposer.appConfigIsUndefined(['configurations', configurationName, 'apps', 1])
        );
      });

      test('apps have no name (collision)', async () => {
        localConfig.apps = ['example1', 'example2'];

        await expect(compose).rejects.toThrowError(errorComposer.duplicateAppConfig({
          appName: undefined,
          appPath: ['apps', 'example2'],
          preExistingAppPath: ['apps', 'example1'],
        }));
      });

      test('apps have the same name (collision)', async () => {
        globalConfig.apps.example1.name = 'sameApp';
        globalConfig.apps.example2.name = 'sameApp';
        localConfig.apps = ['example1', 'example2'];

        await expect(compose).rejects.toThrowError(errorComposer.duplicateAppConfig({
          appName: 'sameApp',
          appPath: ['apps', 'example2'],
          preExistingAppPath: ['apps', 'example1'],
        }));
      });

      test.each([
        ['ios.app', 'ios.simulator'],
        ['android.apk', 'android.attached'],
        ['android.apk', 'android.emulator'],
        ['android.apk', 'android.genycloud'],
      ])('known app (device type = %s) has no binaryPath', async (appType, deviceType) => {
        delete globalConfig.apps.example1.binaryPath;
        globalConfig.apps.example1.type = appType;
        deviceConfig.type = deviceType;
        localConfig.app = 'example1';

        await expect(compose).rejects.toThrowError(errorComposer.missingAppBinaryPath(
          ['apps', 'example1']
        ));
      });

      test.each([
        ['ios.app', 'ios.simulator'],
        ['android.apk', 'android.attached'],
        ['android.apk', 'android.emulator'],
        ['android.apk', 'android.genycloud'],
      ])('known app (device type = %s) has malformed launchArgs', async (appType, deviceType) => {
        globalConfig.apps.example1.launchArgs = '-hello -world';
        globalConfig.apps.example1.type = appType;
        deviceConfig.type = deviceType;
        localConfig.app = 'example1';

        await expect(compose).rejects.toThrowError(errorComposer.malformedAppLaunchArgs(
          ['apps', 'example1']
        ));
      });

      test.each([
        ['ios.app', 'ios.simulator'],
      ])('known app (device type = %s) has unsupported reversePorts', async (appType, deviceType) => {
        globalConfig.apps.example1.reversePorts = [3000];
        globalConfig.apps.example1.type = appType;
        deviceConfig.type = deviceType;
        localConfig.app = 'example1';

        await expect(compose).rejects.toThrowError(errorComposer.unsupportedReversePorts(
          ['apps', 'example1']
        ));
      });

      test.each([
        ['android.apk', 'ios.simulator'],
        ['ios.app', 'android.attached'],
        ['ios.app', 'android.emulator'],
        ['ios.app', 'android.genycloud'],
      ])('app type (%s) is incompatible with device (%s)', async (appType, deviceType) => {
        localConfig.app = 'example1';
        globalConfig.apps.example1.type = appType;
        deviceConfig.type = deviceType;

        await expect(compose).rejects.toThrowError(
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
