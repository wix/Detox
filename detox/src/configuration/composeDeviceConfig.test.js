const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');

describe('composeDeviceConfig', () => {
  let composeDeviceConfig;
  let configurationName, cliConfig, localConfig;
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;

  beforeEach(() => {
    errorBuilder = new DetoxConfigErrorBuilder();
    composeDeviceConfig = require('./composeDeviceConfig');
    cliConfig = {};
    configurationName = 'someConfig';
    localConfig = {
      type: 'ios.simulator',
      device: {
        type: 'iPhone X'
      },
    };
  });

  const compose = () => composeDeviceConfig({
    configurationName,
    cliConfig,
    localConfig,
    errorBuilder,
  });

  describe('validation', () => {
    it('should throw if configuration is not defined', () => {
      localConfig = undefined;
      expect(compose).toThrowError(errorBuilder.missingConfigurationType());
    });

    it('should throw if configuration driver (type) is not defined', () => {
      delete localConfig.type;
      expect(compose).toThrowError(errorBuilder.missingConfigurationType());
    });

    it('should throw if device query is not defined', () => {
      delete localConfig.device;
      expect(compose).toThrowError(errorBuilder.missingDeviceProperty());
    });

    it('should throw if util-binary paths are malformed', () => {
      localConfig.utilBinaryPaths = 'valid/path/not/in/array';
      expect(compose).toThrowError(errorBuilder.malformedUtilBinaryPaths());
    });

    it('should throw if app launch args is a string', () => {
      localConfig.launchArgs = '-detoxAppArgument NO';
      expect(compose).toThrowError(errorBuilder.malformedAppLaunchArgs());
    });

    it('should not throw if app launch args has an undefined property', () => {
      localConfig.launchArgs = { arg: undefined };
      expect(compose).not.toThrowError();
    });

    it('should throw if app launch args has a non-string property', () => {
      localConfig.launchArgs = { debugSomething: false };
      expect(compose).toThrowError(errorBuilder.malformedAppLaunchArgsProperty('debugSomething'));
    });
  });

  describe('if a device configuration has the old .name property', () => {
    beforeEach(() => {
      localConfig.name = localConfig.device;
      delete localConfig.device;
    });

    it('should rename it to .device', () => {
      const { type, device, name } = compose();

      expect(type).toBe('ios.simulator');
      expect(name).toBe(undefined);
      expect(device).toEqual({ type: 'iPhone X' });
    });
  });

  describe('if a device configuration has the new .device property', () => {
    beforeEach(() => {
      localConfig.device = 'iPhone SE';
    });

    it('should be left intact', () => {
      const { type, device } = compose();

      expect(type).toBe('ios.simulator');
      expect(device).toBe('iPhone SE');
    });

    describe('and there is a CLI override', () => {
      beforeEach(() => {
        cliConfig.deviceName = 'iPad Air';
      });

      it('should be override .device property', () => {
        const { type, device } = compose();

        expect(type).toBe('ios.simulator');
        expect(device).toBe('iPad Air');
      });
    });
  });

  describe('if a device configuration has .launchArgs property', () => {
    beforeEach(() => {
      localConfig.launchArgs = {
        arg1: 'value 1',
        arg2: 'value 2',
      };
    });

    it('should be left intact', () => {
      const { launchArgs } = compose();

      expect(launchArgs).toEqual({
        arg1: 'value 1',
        arg2: 'value 2',
      });
    });

    describe('and there is a CLI override', () => {
      beforeEach(() => {
        cliConfig.appLaunchArgs = '-arg3="value 3" --no-arg2';
      });

      it('should parse it and merge the values inside', () => {
        const { launchArgs } = compose();

        expect(launchArgs).toEqual({
          arg1: 'value 1',
          arg3: 'value 3',
        });
      });
    });
  });
});
