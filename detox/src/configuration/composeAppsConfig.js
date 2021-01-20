/**
 * @param {DetoxConfigErrorBuilder} opts.errorBuilder
 * @param {Detox.DetoxConfig} opts.globalConfig
 * @param {Detox.DetoxConfiguration} opts.localConfig
 * @param {*} opts.cliConfig
 */
function composeAppsConfig(opts) {
  const { localConfig } = opts;

  return {
    '': {
      type: 'ios.app',
      binaryPath: localConfig.binaryPath,
      testBinaryPath: localConfig.testBinaryPath,
      build: localConfig.build,
      bundleId: localConfig.bundleId,
      launchArgs: localConfig.launchArgs,
    },
  };
}

module.exports = composeAppsConfig;
