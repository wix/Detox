const DetoxConfigErrorComposer = require('../errors/DetoxConfigErrorComposer');

const { androidEmulator, apkWithBinary } = require('./configurations.mock');

describe('selectConfiguration', () => {
  let selectConfiguration;
  /** @type {DetoxConfigErrorComposer} */
  let errorComposer;
  let configLocation, globalConfig, cliConfig;

  beforeEach(() => {
    configLocation = '/etc/detox/config.js';
    globalConfig = {};
    cliConfig = {};
    errorComposer = new DetoxConfigErrorComposer().setDetoxConfig(globalConfig);

    selectConfiguration = require('./selectConfiguration');
  });

  const select = () => selectConfiguration({
    configLocation,
    cliConfig,
    globalConfig,
    errorComposer,
  });

  it('should throw if there are no .configurations in Detox config', () => {
    configLocation = '';
    delete globalConfig.configurations;
    expect(select).toThrowError(errorComposer.noConfigurationsInside());
  });

  it('should throw if there is an empty .configurations object in Detox config and its location is unknown', () => {
    configLocation = '';
    globalConfig.configurations = {};
    expect(select).toThrowError(errorComposer.noConfigurationsInside());
  });

  it('should return the name of a single configuration', () => {
    globalConfig.configurations = { single: { ...apkWithBinary, ...androidEmulator } };
    expect(select()).toBe('single');
  });

  it('should throw if a configuration with the specified name does not exist', () => {
    globalConfig.configurations = { single: { ...apkWithBinary, ...androidEmulator } };
    globalConfig.selectedConfiguration = 'double';

    expect(select).toThrow(); // generating a correct error expectation in errorComposer

    jest.spyOn(errorComposer, 'setConfigurationName');
    expect(select).toThrow(errorComposer.noConfigurationWithGivenName());
    expect(errorComposer.setConfigurationName).toHaveBeenCalledWith('double');
  });

  it('should throw if a configuration with the specified name is empty ', () => {
    globalConfig.configurations = { single: {} };
    globalConfig.selectedConfiguration = 'single';

    expect(select).toThrow(); // generating a correct error expectation in errorComposer

    jest.spyOn(errorComposer, 'setConfigurationName');
    expect(select).toThrow(errorComposer.configurationShouldNotBeEmpty());
    expect(errorComposer.setConfigurationName).toHaveBeenCalledWith('single');
  });

  it('should throw if there is more than 1 configuration, and no one is specified', () => {
    configLocation = '';
    globalConfig.configurations = {
      config1: { ...apkWithBinary, ...androidEmulator },
      config2: { ...apkWithBinary, ...androidEmulator }
    };
    expect(select).toThrow(errorComposer.cantChooseConfiguration());
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
