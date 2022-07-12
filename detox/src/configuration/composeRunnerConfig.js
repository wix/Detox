/**
 * @param {object} opts
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {DetoxInternals.DetoxCLIConfig} opts.cliConfig
 * @param {Record<string, any>} opts.testRunnerArgv
 * @param {import('../errors/DetoxConfigErrorComposer')} opts.errorComposer
 * @returns {Detox.DetoxTestRunnerConfig} opts.testRunnerArgv
 */
function composeRunnerConfig(opts) {
  const globalConfig = opts.globalConfig.testRunner;
  if (globalConfig != null && typeof globalConfig !== 'object') {
    throw opts.errorComposer.invalidTestRunnerProperty(true);
  }

  const localConfig = opts.localConfig.testRunner;
  if (localConfig != null && typeof localConfig !== 'object') {
    throw opts.errorComposer.invalidTestRunnerProperty(false);
  }

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

    if (globalConfig.jest) {
      merged.jest = Object.assign(merged.jest || {}, globalConfig.jest);
    }
  }

  if (localConfig) {
    Object.assign(merged.args, localConfig.args);

    if (localConfig.jest) {
      merged.jest = Object.assign(merged.jest || {}, localConfig.jest);
    }
  }

  if (cliConfig.jestReportSpecs != null) {
    merged.jest = Object.assign(merged.jest || {}, {
      reportSpecs: cliConfig.jestReportSpecs,
    });
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
