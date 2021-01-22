const _ = require('lodash');
const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');
const {
  appWithAbsoluteBinaryPath,
  appWithRelativeBinaryPath,
  iosSimulatorWithShorthandQuery,
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
        launchArgs: { hello: 'world' }
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

  describe('given an unknown device type', () => {
    it('should not attempt to extract app config', () => {
      deviceConfig.type = './myDriver';
      expect(_.isEmpty(compose())).toBe(true);
    });
  });

  describe.skip('given an aliased configuration with inlined device', () => {
    beforeEach(() => {
      localConfig = {
        device: {
          type: 'ios.simulator',
          device: { type: 'iPhone X' }
        },
        artifacts: false,
      };
    });

    it('should extract type and device', () => {
      expect(compose()).toEqual({
        type: 'ios.simulator',
        device: { type: 'iPhone X' }
      });
    });

    describe('and there is a CLI override', () => {
      beforeEach(givenCLIOverride('iPad'));

      it('should be override .device property', assertCLIOverridesDevice({
        type: 'ios.simulator',
        device: 'iPad',
      }));
    });
  });

  function givenCLIOverride(deviceName) {
    return function () {
      cliConfig.deviceName = deviceName;
    };
  }

  function assertCLIOverridesDevice(expected) {
    return function () {
      const { type, device } = compose();

      expect(type).toBe(expected.type);
      expect(device).toBe(expected.device);
    };
  }

  describe.skip('unhappy scenarios:', () => {
    describe('aliased configuration', () => {
      it('should throw if devices are not declared', () => {
        localConfig.device = 'someDevice';
        expect(compose).toThrow(errorBuilder.cantFindDeviceConfig());
      });

      it('should throw if device config is not found', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = { otherDevice: iosSimulatorWithShorthandQuery };

        expect(compose).toThrow(errorBuilder.cantFindDeviceConfig());
      });
    });

    describe('empty device object', () => {
      it('should throw if the inline device config has no type', () => {
        localConfig.device = {};
        expect(compose).toThrow(errorBuilder.missingDeviceType());
      });

      it('should throw if the aliased device config has no type', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = { someDevice: { } };

        expect(compose).toThrow(errorBuilder.missingDeviceType());
      });

      it('should throw if the inline device config is empty', () => {
        localConfig.type = 'ios.simulator';
        localConfig.device = {};

        expect(compose).toThrow(errorBuilder.missingDeviceProperty());
      });

      it('should throw if the aliased device config is empty', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = { someDevice: { type: 'ios.simulator' } };

        expect(compose).toThrow(errorBuilder.missingDeviceProperty());
      });
    });

    describe('missing device matcher properties', () => {
      it.each([
        [['id', 'type', 'name', 'os'], 'ios.simulator'],
        [['adbName'], 'android.attached'],
        [['avdName'], 'android.emulator'],
        [['recipeUUID', 'recipeName'], 'android.genycloud'],
      ])('should throw for missing %j for "%s" type', (expectedProps, deviceType) => {
        localConfig.device = {
          type: deviceType,
          device: {
            misspelled: 'value'
          }
        };

        expect(compose).toThrowError(errorBuilder.missingDeviceMatcherProperties(expectedProps));

        localConfig.device.device[_.sample(expectedProps)] = 'someValue';
        expect(compose).not.toThrowError();
      });
    });
  });
});
