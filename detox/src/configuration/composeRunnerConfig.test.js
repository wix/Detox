// @ts-nocheck
describe('composeRunnerConfig', () => {
  let composeRunnerConfig;
  let cliConfig, globalConfig;

  beforeEach(() => {
    cliConfig = {};
    globalConfig = {};

    composeRunnerConfig = () => require('./composeRunnerConfig')({
      cliConfig,
      globalConfig,
    });
  });

  it('should take .testRunner from globalConfig', () => {
    globalConfig.testRunner = 'jest';
    expect(composeRunnerConfig().testRunner).toBe('jest');
  });

  it('should take .test-runner from globalConfig', () => {
    globalConfig['test-runner'] = 'jest';
    expect(composeRunnerConfig().testRunner).toBe('jest');
  });

  it('should set .testRunner to "mocha" by default', () => {
    expect(composeRunnerConfig().testRunner).toBe('mocha');
  });

  it('should take .runnerConfig from CLI', () => {
    globalConfig.runnerConfig = 'from/config.json';
    cliConfig.runnerConfig = 'from/cli.json';

    expect(composeRunnerConfig().runnerConfig).toBe('from/cli.json');
  });

  it('should take .runnerConfig from config if it is not defined via CLI', () => {
    globalConfig.runnerConfig = 'from/config.json';
    delete cliConfig.runnerConfig;

    expect(composeRunnerConfig().runnerConfig).toBe('from/config.json');
  });

  it('should take .runner-config from config if it is not defined via CLI', () => {
    globalConfig['runner-config'] = 'from/config.json';
    delete cliConfig.runnerConfig;

    expect(composeRunnerConfig().runnerConfig).toBe('from/config.json');
  });

  it('should set .runnerConfig to e2e/mocha.opts if .testRunner is mocha', () => {
    globalConfig.testRunner = 'mocha';
    expect(composeRunnerConfig().runnerConfig).toBe('e2e/mocha.opts');
  });

  it('should set .runnerConfig to e2e/config.json if .testRunner is jest', () => {
    globalConfig.testRunner = 'jest';
    expect(composeRunnerConfig().runnerConfig).toBe('e2e/config.json');
  });

  it('should take .specs from globalConfig', () => {
    globalConfig.specs = 'e2e/suite1';
    expect(composeRunnerConfig().specs).toBe('e2e/suite1');
  });

  it('should set .specs to default e2e/ value', () => {
    delete globalConfig.specs;
    expect(composeRunnerConfig().specs).toBe('e2e');
  });

});
