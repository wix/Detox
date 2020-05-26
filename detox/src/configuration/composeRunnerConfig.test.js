describe('composeRunnerConfig', () => {
  let composeRunnerConfig;
  let cliConfig, detoxConfig;

  beforeEach(() => {
    cliConfig = {};
    detoxConfig = {};

    composeRunnerConfig = () => require('./composeRunnerConfig')({
      cliConfig,
      detoxConfig,
    });
  });

  it('should take .testRunner from detoxConfig', () => {
    detoxConfig.testRunner = 'jest';
    expect(composeRunnerConfig().testRunner).toBe('jest');
  });

  it('should take .test-runner from detoxConfig', () => {
    detoxConfig['test-runner'] = 'jest';
    expect(composeRunnerConfig().testRunner).toBe('jest');
  });

  it('should set .testRunner to "mocha" by default', () => {
    expect(composeRunnerConfig().testRunner).toBe('mocha');
  });

  it('should take .runnerConfig from CLI', () => {
    detoxConfig.runnerConfig = 'from/config.json';
    cliConfig.runnerConfig = 'from/cli.json';

    expect(composeRunnerConfig().runnerConfig).toBe('from/cli.json');
  });

  it('should take .runnerConfig from config if it is not defined via CLI', () => {
    detoxConfig.runnerConfig = 'from/config.json';
    delete cliConfig.runnerConfig;

    expect(composeRunnerConfig().runnerConfig).toBe('from/config.json');
  });

  it('should take .runner-config from config if it is not defined via CLI', () => {
    detoxConfig['runner-config'] = 'from/config.json';
    delete cliConfig.runnerConfig;

    expect(composeRunnerConfig().runnerConfig).toBe('from/config.json');
  });

  it('should set .runnerConfig to e2e/mocha.opts if .testRunner is mocha', () => {
    detoxConfig.testRunner = 'mocha';
    expect(composeRunnerConfig().runnerConfig).toBe('e2e/mocha.opts');
  });

  it('should set .runnerConfig to e2e/config.json if .testRunner is jest', () => {
    detoxConfig.testRunner = 'jest';
    expect(composeRunnerConfig().runnerConfig).toBe('e2e/config.json');
  });

  it('should take .specs from detoxConfig', () => {
    detoxConfig.specs = 'e2e/suite1';
    expect(composeRunnerConfig().specs).toBe('e2e/suite1');
  });

  it('should set .specs to default e2e/ value', () => {
    delete detoxConfig.specs;
    expect(composeRunnerConfig().specs).toBe('e2e');
  });

});
