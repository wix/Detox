const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');
const { apkWithBinary, androidEmulator } = require('./configurations.mock');

describe('selectConfiguration', () => {
  let selectConfiguration;
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;
  let configLocation, globalConfig, cliConfig;

  beforeEach(() => {
    configLocation = '/etc/detox/config.js';
    globalConfig = {};
    cliConfig = {};
    errorBuilder = new DetoxConfigErrorBuilder().setDetoxConfig(globalConfig);

    selectConfiguration = require('./selectConfiguration');
  });

  const select = () => selectConfiguration({
    configLocation,
    cliConfig,
    globalConfig,
    errorBuilder,
  });

  it('should throw if there are no .configurations in Detox config', () => {
    configLocation = '';
    delete globalConfig.configurations;
    expect(select).toThrowError(errorBuilder.noConfigurationsInside());
  });

  it('should throw if there is an empty .configurations object in Detox config and its location is unknown', () => {
    configLocation = '';
    globalConfig.configurations = {};
    expect(select).toThrowError(errorBuilder.noConfigurationsInside());
  });

  it('should return the name of a single configuration', () => {
    globalConfig.configurations = { single: { ...apkWithBinary, ...androidEmulator } };
    expect(select()).toBe('single');
  });

  it('should throw if a configuration with the specified name does not exist', () => {
    globalConfig.configurations = { single: { ...apkWithBinary, ...androidEmulator } };
    globalConfig.selectedConfiguration = 'double';

    expect(select).toThrow(); // generating a correct error expectation in errorBuilder

    jest.spyOn(errorBuilder, 'setConfigurationName');
    expect(select).toThrow(errorBuilder.noConfigurationWithGivenName());
    expect(errorBuilder.setConfigurationName).toHaveBeenCalledWith('double');
  });

  it('should throw if a configuration with the specified name is empty ', () => {
    globalConfig.configurations = { single: {} };
    globalConfig.selectedConfiguration = 'single';

    expect(select).toThrow(); // generating a correct error expectation in errorBuilder

    jest.spyOn(errorBuilder, 'setConfigurationName');
    expect(select).toThrow(errorBuilder.configurationShouldNotBeEmpty());
    expect(errorBuilder.setConfigurationName).toHaveBeenCalledWith('single');
  });

  it('should throw if there is more than 1 configuration, and no one is specified', () => {
    configLocation = '';
    globalConfig.configurations = {
      config1: { ...apkWithBinary, ...androidEmulator },
      config2: { ...apkWithBinary, ...androidEmulator }
    };
    expect(select).toThrow(errorBuilder.cantChooseConfiguration());
  });

  describe('priority', () => {
    beforeEach(() => {
      globalConfig.configurations = {
        cli: { type: 'ios.simulator' },
        config: { type: 'android.emulator' },
      };
    });

    it('should be given to CLI --configuration (first)', () => {
      globalConfig.selectedConfiguration = 'config';
      cliConfig.configuration = 'cli';

      expect(select()).toBe('cli');
    });

    it('should be given to config file value (second)', () => {
      globalConfig.selectedConfiguration = 'config';

      expect(select()).toBe('config');
    });
  });
});
