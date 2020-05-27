const _ = require('lodash');

function composeBehaviorConfig({ cliConfig, detoxConfig, deviceConfig, userParams }) {
  return _.defaultsDeep(
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
        launchApp: userParams.launchApp,
        reinstallApp: negateDefined(userParams.reuse),
      },
    },
    deviceConfig.behavior,
    detoxConfig.behavior,
    {
      init: {
        exposeGlobals: true,
        reinstallApp: true,
        launchApp: true,
      },
      cleanup: {
        shutdownDevice: false,
      },
    }
  );
}

function negateDefined(x) {
  return x !== undefined ? !x : undefined;
}

module.exports = composeBehaviorConfig;
