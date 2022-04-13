// @ts-nocheck
/**
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfigurationOverrides} localConfig
 */
function composeRunnerConfig({ globalConfig, cliConfig }) {
  const testRunner = globalConfig.testRunner || globalConfig['test-runner'] || 'jest';
  const customRunnerConfig = cliConfig.runnerConfig || globalConfig.runnerConfig || globalConfig['runner-config'];

  return {
    testRunner,
    runnerConfig: customRunnerConfig || 'e2e/config.json',
    specs: globalConfig.specs || '',
  };
}

module.exports = composeRunnerConfig;
