const _ = require('lodash');

/**
 * @param {*} cliConfig
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfigurationOverrides} localConfig
 * @param {Detox.DetoxInitOptions} userParams
 */
function composeBehaviorConfig({
  cliConfig,
  globalConfig,
  localConfig,
  userParams
}) {
  return _.chain({})
    .defaultsDeep(
      {
        init: {
          reinstallApp: cliConfig.reuse ? false : undefined,
        },
        cleanup: {
          shutdownDevice: cliConfig.cleanup ? true : undefined,
        },
      },
      userParams && {
        init: {
          exposeGlobals: userParams.initGlobals,
          reinstallApp: negateDefined(userParams.reuse),
        },
      },
      localConfig.behavior,
      globalConfig.behavior,
      {
        init: {
          exposeGlobals: true,
          reinstallApp: undefined,
        },
        launchApp: 'auto',
        cleanup: {
          shutdownDevice: false,
        },
      }
    )
    .tap(config => {
      if (config.init.reinstallApp === undefined) {
        config.init.reinstallApp = config.launchApp !== 'manual';
      }
    })
    .value();
}

function negateDefined(x) {
  return x !== undefined ? !x : undefined;
}

module.exports = composeBehaviorConfig;
