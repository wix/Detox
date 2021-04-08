const _ = require('lodash');
const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');
const { appWithRelativeBinaryPath, iosSimulatorWithShorthandQuery } = require('./configurations.mock');

describe('composeDeviceConfig', () => {
  let composeDeviceConfig;
  /** @type {*} */
  let cliConfig;
  /** @type {Detox.DetoxConfiguration} */
  let localConfig;
  /** @type {Detox.DetoxConfig} */
  let globalConfig;
  /** @type {DetoxConfigErrorComposer} */
  let errorComposer;
  /** @type {DriverRegistry} */
  let driverRegistry;

  beforeEach(() => {
    jest.mock('../devices/DriverRegistry', () => {
      const DriverRegistry = jest.requireActual('../devices/DriverRegistry');
      driverRegistry = DriverRegistry.default;
      return DriverRegistry;
    });

    cliConfig = {};
    localConfig = {};
    globalConfig = {
      configurations: {
        someConfig: localConfig,
      },
    }

    errorComposer = new DetoxConfigErrorComposer()
      .setDetoxConfig(globalConfig)
      .setConfigurationName('someConfig');

    composeDeviceConfig = require('./composeDeviceConfig');
  });

  const compose = () => composeDeviceConfig({
    errorComposer,
    globalConfig,
    localConfig,
    cliConfig,
  });

  describe('given a plain configuration', () => {
    beforeEach(() => {
      localConfig = {
        ...appWithRelativeBinaryPath,
        ...iosSimulatorWithShorthandQuery,
      };
    });

    it('should extract type, device and utilBinaryPaths', () => {
      localConfig.utilBinaryPaths = ['someApp'];
      expect(compose()).toEqual({
        type: localConfig.type,
        device: localConfig.device,
        utilBinaryPaths: localConfig.utilBinaryPaths,
      });
    });

    it('should extract type and device <- name', () => {
      localConfig.name = localConfig.device;
      delete localConfig.device;

      expect(compose()).toEqual({
        type: localConfig.type,
        device: localConfig.name,
      });
    });

    describe('with unknown device type', () => {
      const values = {
        type: './customDriver',
        device: 'firefox',
        binaryPath: 'https://example.com',
      };

      beforeEach(() => {
        Object.assign(localConfig, values);
        driverRegistry.resolve = () => (class SomeDriver {});
      });

      it('should take it as is, for backward compatibility', () => {
        expect(compose()).toEqual(values);
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

  describe('given an aliased configuration', () => {
    beforeEach(() => {
      localConfig = { device: 'iphone' };
      globalConfig = { devices: { iphone: { type: 'ios.none' } } };
    });

    it('should extract type and device', () => {
      expect(compose()).toEqual({
        type: 'ios.none',
      });
    });

    describe('and there is a CLI override', () => {
      beforeEach(givenCLIOverride('iPad'));

      it('should be override .device property', assertCLIOverridesDevice({
        type: 'ios.none',
        device: 'iPad',
      }));
    });
  });

  describe('given an aliased configuration with inlined device', () => {
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

  describe('unhappy scenarios:', () => {
    describe('aliased configuration', () => {
      it('should throw if devices are not declared', () => {
        localConfig.device = 'someDevice';
        expect(compose).toThrow(errorComposer.thereAreNoDeviceConfigs('someDevice'));
      });

      it('should throw if device config is not found (alias)', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = { otherDevice: iosSimulatorWithShorthandQuery };

        expect(compose).toThrow(errorComposer.cantResolveDeviceAlias('someDevice'));
      });

      it('should throw if device config is not found (inline)', () => {
        delete localConfig.device;
        globalConfig.devices = { otherDevice: iosSimulatorWithShorthandQuery };

        expect(compose).toThrow(errorComposer.deviceConfigIsUndefined());
      });

      it('should throw if device.utilBinaryPaths are malformed (string)', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = {
          [localConfig.device]: {
            type: 'android.emulator',
            device: { avdName: 'Pixel' },
            utilBinaryPaths: 'valid/path/not/in/array',
          },
        }

        expect(compose).toThrowError(
          errorComposer.malformedUtilBinaryPaths(localConfig.device)
        );
      });
    });

    describe('empty device object', () => {
      it('should throw if the inline device config has no type', () => {
        localConfig.device = {};
        expect(compose).toThrow(errorComposer.missingDeviceType());
      });

      it('should throw if the aliased device config has no type', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = { someDevice: { } };

        expect(compose).toThrow(errorComposer.missingDeviceType('someDevice'));
      });

      it('should throw if the inline device config is empty', () => {
        localConfig.type = 'android.emulator';
        localConfig.device = {};

        expect(compose).toThrow(errorComposer.missingDeviceMatcherProperties(undefined, [
          'avdName'
        ]));
      });

      it('should throw if the aliased device config is missing properties', () => {
        localConfig.device = 'someDevice';
        globalConfig.devices = {
          someDevice: {
            type: 'ios.simulator',
            device: { os: 'iOS 9.3.5' }
          },
        };

        expect(compose).toThrow(errorComposer.missingDeviceMatcherProperties('someDevice', [
          'type',
          'name',
          'id',
        ]));
      });
    });

    it('should throw if the device config has invalid type', () => {
      const someError = new Error('Some error');
      driverRegistry.resolve = () => { throw someError };

      localConfig.device = { type: 'android.apk' };
      expect(compose).toThrow(errorComposer.invalidDeviceType(
        undefined,
        localConfig.device,
        someError
      ));
    });

    describe('missing device matcher properties', () => {
      it.each([
        [['type', 'name', 'id'], 'ios.simulator'],
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

        expect(compose).toThrowError(errorComposer.missingDeviceMatcherProperties(undefined, expectedProps));

        localConfig.device.device[_.sample(expectedProps)] = 'someValue';
        expect(compose).not.toThrowError();
      });
    });

    it('should throw if .utilBinaryPaths are malformed (array of non-strings)', () => {
      Object.assign(localConfig, {
        type: 'android.emulator',
        device: { avdName: 'Pixel' },
        utilBinaryPaths: [{ path: 'valid/path/not/in/array' }],
      });

      expect(compose).toThrowError(
        errorComposer.malformedUtilBinaryPaths(undefined)
      );
    });
  });
});
