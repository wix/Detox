// @ts-nocheck
const _ = require('lodash');

const logger = require('../../src/utils/logger').child({ cat: 'config' });

/**
 * @param {*} cliConfig
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfiguration} localConfig
 * @param {@param {string} opts.configurationName}
 * @param {string} configurationName
 */
function composeBehaviorConfig({
  cliConfig,
  globalConfig,
  localConfig,
  configurationName
}) {
  logger.warn(`[BehaviorConfig] The 'Behaviour' config section is not supported for device type android.cloud and will be ignored.`);
  return _.chain({})
    .defaultsDeep(
      {
        init: {
          keepLockFile: cliConfig.keepLockFile ? true : undefined,
          reinstallApp: configurationName === 'android.cloud.release' ? false : cliConfig.reuse ? false : undefined,
        },
        cleanup: {
          shutdownDevice: configurationName === 'android.cloud.release' ? false : cliConfig.cleanup ? true : undefined
        },
        launchApp: configurationName === 'android.cloud.release' ? 'auto' : undefined
      },
      localConfig.behavior,
      globalConfig.behavior,
      {
        init: {
          exposeGlobals: true,
          keepLockFile: false,
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

module.exports = composeBehaviorConfig;
