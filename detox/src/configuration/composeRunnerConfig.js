/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {Record<string, any>} opts.cliConfig
 * @param {Record<string, any>} opts.testRunnerArgv
 * @returns {Detox.DetoxTestRunnerConfig} opts.testRunnerArgv
 */
function composeRunnerConfig(opts) {
  const globalConfig = opts.globalConfig.testRunner;
  const localConfig = opts.localConfig.testRunner;
  const cliConfig = opts.cliConfig;
  const argOverrides = opts.testRunnerArgv;

  /** @type {Detox.DetoxTestRunnerConfig} */
  const merged = {
    retries: 0,
    inspectBrk: false,

    ...globalConfig,
    ...localConfig,

    args: {
      $0: 'jest',
      _: [],
    },
  };

  if (cliConfig.retries != null) {
    merged.retries = cliConfig.retries;
  }

  if (cliConfig.inspectBrk != null) {
    merged.inspectBrk = cliConfig.inspectBrk;
  }

  if (globalConfig) {
    Object.assign(merged.args, globalConfig.args);
  }

  if (localConfig) {
    Object.assign(merged.args, localConfig.args);
  }

  if (argOverrides) {
    const theArgs = merged.args;
    for (const key of Object.keys(argOverrides)) {
      const defaultValue = theArgs[key];
      const value = argOverrides[key];

      if (key === '_' && !value || (Array.isArray(value) && value.length === 0)) {
        continue;
      }

      theArgs[key] = typeof defaultValue === 'function'
        ? defaultValue(value)
        : value;
    }
  }

  return merged;
}

module.exports = composeRunnerConfig;
