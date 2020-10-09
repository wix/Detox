const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');

describe('composeDeviceConfig', () => {
  let composeDeviceConfig;
  let configurationName, cliConfig, rawDeviceConfig;
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;

  beforeEach(() => {
    errorBuilder = new DetoxConfigErrorBuilder();
    composeDeviceConfig = require('./composeDeviceConfig');
    cliConfig = {};
    configurationName = 'someConfig';
    rawDeviceConfig = {
      type: 'ios.simulator',
      device: {
        type: 'iPhone X'
      },
    };
  });

  const compose = () => composeDeviceConfig({
    configurationName,
    cliConfig,
    rawDeviceConfig,
    errorBuilder,
  });

  describe('validation', () => {
    it('should throw if configuration is not defined', () => {
      rawDeviceConfig = undefined;
      expect(compose).toThrowError(errorBuilder.missingConfigurationType());
    });

    it('should throw if configuration driver (type) is not defined', () => {
      delete rawDeviceConfig.type;
      expect(compose).toThrowError(errorBuilder.missingConfigurationType());
    });

    it('should throw if device query is not defined', () => {
      delete rawDeviceConfig.device;
      expect(compose).toThrowError(errorBuilder.missingDeviceProperty());
    });

    it('should throw if util-binary paths are malformed', () => {
      rawDeviceConfig.utilBinaryPaths = 'valid/path/not/in/array';
      expect(compose).toThrowError(errorBuilder.malformedUtilBinaryPaths());
    });

    it('should throw if app launch args is a string', () => {
      rawDeviceConfig.launchArgs = '-detoxAppArgument NO';
      expect(compose).toThrowError(errorBuilder.malformedAppLaunchArgs());
    });
  });

  describe('if a device configuration has the old .name property', () => {
    beforeEach(() => {
      rawDeviceConfig.name = rawDeviceConfig.device;
      delete rawDeviceConfig.device;
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
      rawDeviceConfig.device = 'iPhone SE';
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
      rawDeviceConfig.launchArgs = {
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
