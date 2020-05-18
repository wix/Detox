describe('selectConfiguration', () => {
  let selectConfiguration;
  let detoxConfig, cliConfig;

  beforeEach(() => {
    detoxConfig = {};
    cliConfig = {};

    selectConfiguration = require('./selectConfiguration');
  });

  const select = () => selectConfiguration({ cliConfig, detoxConfig });

  it('should throw if there are no .configurations in Detox config', () => {
    delete detoxConfig.configurations;
    expect(select).toThrowError(/There are no device configurations/)
  });

  it('should throw if there is an empty .configurations object in Detox config', () => {
    detoxConfig.configurations = {};
    expect(select).toThrowError(/There are no device configurations/)
  });

  it('should return the name of a single configuration', () => {
    detoxConfig.configurations = { single: {} };
    expect(select()).toBe('single');
  });

  it('should throw if a configuration with the specified name does not exist', () => {
    detoxConfig.configurations = { single: {} };
    detoxConfig.selectedConfiguration = 'double';

    expect(select).toThrow(/Failed to find.*double.*in Detox config[\s\S]*^\* single/m);
  });

  it('should throw if there is more than 1 configuration, and no one is specified', () => {
    detoxConfig.configurations = { config1: {}, config2: {} };
    expect(select).toThrow(/Cannot determine which[\s\S]*^\* config2/m);
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
