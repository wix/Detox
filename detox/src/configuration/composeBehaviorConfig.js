// @ts-nocheck
const _ = require('lodash');

/**
 * @param {*} cliConfig
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfiguration} localConfig
 */
function composeBehaviorConfig({
  cliConfig,
  globalConfig,
  localConfig,
}) {
  return _.chain({})
    .defaultsDeep(
      {
        init: {
          keepLockFile: cliConfig.keepLockFile ? true : undefined,
          reinstallApp: cliConfig.reuse ? false : undefined,
        },
        optimizeAppInstall: cliConfig.optimizeAppInstall ? true : undefined,
        cleanup: {
          shutdownDevice: cliConfig.cleanup ? true : undefined,
        },
      },
      localConfig.behavior,
      globalConfig.behavior,
      {
        init: {
          exposeGlobals: true,
          keepLockFile: false,
          reinstallApp: undefined,
        },
        optimizeAppInstall: false,
        launchApp: 'auto',
        cleanup: {
          shutdownDevice: false,
        },
      },
    )
    .tap(config => {
      if (config.init.reinstallApp === undefined) {
        config.init.reinstallApp = config.launchApp !== 'manual';
      }
    })
    .value();
}

module.exports = composeBehaviorConfig;
