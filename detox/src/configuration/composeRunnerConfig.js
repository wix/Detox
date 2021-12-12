/**
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfigurationOverrides} localConfig
 */
function composeRunnerConfig({ globalConfig, cliConfig }) {
  const testRunner = globalConfig.testRunner || globalConfig['test-runner'] || 'mocha';
  const defaultRunnerConfig = testRunner.includes('mocha') ? 'e2e/mocha.opts' : 'e2e/config.json';
  const customRunnerConfig = cliConfig.runnerConfig || globalConfig.runnerConfig || globalConfig['runner-config'];

  return {
    testRunner,
    runnerConfig: customRunnerConfig || defaultRunnerConfig,
    specs: globalConfig.specs || 'e2e',
    skipLegacyWorkersInjection: Boolean(globalConfig.skipLegacyWorkersInjection),
  };
}

module.exports = composeRunnerConfig;
