const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');

describe('selectConfiguration', () => {
  let selectConfiguration;
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;
  let configLocation, detoxConfig, cliConfig;

  beforeEach(() => {
    configLocation = '/etc/detox/config.js';
    detoxConfig = {};
    cliConfig = {};
    errorBuilder = new DetoxConfigErrorBuilder().setDetoxConfig(detoxConfig);

    selectConfiguration = require('./selectConfiguration');
  });

  const select = () => selectConfiguration({
    configLocation,
    cliConfig,
    detoxConfig,
    errorBuilder,
  });

  it('should throw if there are no .configurations in Detox config', () => {
    configLocation = '';
    delete detoxConfig.configurations;
    expect(select).toThrowError(errorBuilder.noDeviceConfigurationsInside());
  });

  it('should throw if there is an empty .configurations object in Detox config and its location is unknown', () => {
    configLocation = '';
    detoxConfig.configurations = {};
    expect(select).toThrowError(errorBuilder.noDeviceConfigurationsInside());
  });

  it('should return the name of a single configuration', () => {
    detoxConfig.configurations = { single: {} };
    expect(select()).toBe('single');
  });

  it('should throw if a configuration with the specified name does not exist', () => {
    detoxConfig.configurations = { single: {} };
    detoxConfig.selectedConfiguration = 'double';

    expect(select).toThrow(); // generating a correct error expectation in errorBuilder

    jest.spyOn(errorBuilder, 'setConfigurationName');
    expect(select).toThrow(errorBuilder.noDeviceConfigurationWithGivenName());
    expect(errorBuilder.setConfigurationName).toHaveBeenCalledWith('double');
  });

  it('should throw if there is more than 1 configuration, and no one is specified', () => {
    configLocation = '';
    detoxConfig.configurations = { config1: {}, config2: {} };
    expect(select).toThrow(errorBuilder.cantChooseDeviceConfiguration());
  });

  describe('priority', () => {
    beforeEach(() => {
      detoxConfig.configurations = {
        cli: {},
        config: {},
      };
    });

    it('should be given to CLI --configuration (first)', () => {
      detoxConfig.selectedConfiguration = 'config';
      cliConfig.configuration = 'cli';

      expect(select()).toBe('cli');
    });

    it('should be given to config file value (second)', () => {
      detoxConfig.selectedConfiguration = 'config';

      expect(select()).toBe('config');
    });
  });
});
