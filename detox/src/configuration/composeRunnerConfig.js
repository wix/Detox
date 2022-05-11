// @ts-nocheck
/**
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfiguration} localConfig
 */
function composeRunnerConfig({ globalConfig, cliConfig }) {
  const testRunner = globalConfig.testRunner || 'jest';
  const customRunnerConfig = cliConfig.runnerConfig || globalConfig.runnerConfig;

  return {
    testRunner,
    runnerConfig: customRunnerConfig || 'e2e/config.json',
    specs: globalConfig.specs || '',
  };
}

module.exports = composeRunnerConfig;
