function composeRunnerConfig({ detoxConfig, cliConfig }) {
  const testRunner = detoxConfig.testRunner || detoxConfig['test-runner'] || 'mocha';
  const defaultRunnerConfig = testRunner.includes('mocha') ? 'e2e/mocha.opts' : 'e2e/config.json';
  const customRunnerConfig = cliConfig.runnerConfig || detoxConfig.runnerConfig || detoxConfig['runner-config'];

  return {
    testRunner,
    runnerConfig: customRunnerConfig || defaultRunnerConfig,
    specs: detoxConfig.specs || 'e2e',
  };
}

module.exports = composeRunnerConfig;