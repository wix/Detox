// @ts-nocheck
const _ = require('lodash');

const logger = require('../../src/utils/logger').child({ cat: 'config' });

/**
 * @param {*} cliConfig
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfiguration} localConfig
 * @param {Boolean} isCloudSession
 */
function composeBehaviorConfig({
  cliConfig,
  globalConfig,
  localConfig,
  isCloudSession
}) {
  if (isCloudSession) {
    cliConfig.reuse = false;
    cliConfig.cleanup = false;
    logger.warn(`[BehaviorConfig] The 'Behaviour' config section is not supported for device type android.cloud and will be ignored.`);
  }
  return _.chain({})
    .defaultsDeep(
      {
        init: {
          keepLockFile: cliConfig.keepLockFile ? true : undefined,
          reinstallApp: cliConfig.reuse ? false : undefined,
        },
        cleanup: {
          shutdownDevice: cliConfig.cleanup ? true : undefined
        },
        launchApp: isCloudSession ? 'auto' : undefined
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
