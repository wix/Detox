const Detox = require('./Detox');
// const platform = require('./platform');
// const exportWrapper = require('./exportWrapper');
const argparse = require('./utils/argparse');
const configuration = require('./configuration');
const _ = require('lodash');

let detox;

function getDeviceConfig(configurations) {
  const configurationName = argparse.getArgValue('configuration');

  const deviceConfig = (!configurationName && _.size(configurations) === 1)
    ? _.values(configurations)[0]
    : configurations[configurationName];

  if (!deviceConfig) {
    throw new Error(`Cannot determine which configuration to use. use --configuration to choose one of the following:
                      ${Object.keys(configurations)}`);
  }
  if (!deviceConfig.type) {
    configuration.throwOnEmptyType();
  }

  if (!deviceConfig.name) {
    configuration.throwOnEmptyName();
  }

  return deviceConfig;
}

function validateConfig(config) {
  if (!config) {
    throw new Error(`No configuration was passed to detox, make sure you pass a config when calling 'detox.init(config)'`);
  }

  if (!(config.configurations && _.size(config.configurations) >= 1)) {
    throw new Error(`No configured devices`);
  }
}

async function initializeDetox({configurations, session}, params) {
  const deviceConfig = getDeviceConfig(configurations);

  detox = new Detox({deviceConfig, session});
  await detox.init(params);
  platform.set(deviceConfig.type, detox.device);
}

async function init(config, params) {
  validateConfig(config);
  await initializeDetox(config, params);
}

async function cleanup() {
  if (detox) {
    await detox.cleanup();
  }
}

async function beforeEach() {
  if (detox) {
    await detox.beforeEach.apply(detox, arguments);
  }
}

async function afterEach() {
  if (detox) {
    await detox.afterEach.apply(detox, arguments);
  }
}

//process.on('uncaughtException', (err) => {
//  //client.close();
//
//  throw err;
//});
//
//process.on('unhandledRejection', (reason, p) => {
//  throw reason;
//});

// console.log(exportWrapper);

const platform = require('./platform');
const iosExports = require('./ios/expect');
const androidExports = require('./android/expect');

const exportMap = {
  expect: {
    ios: iosExports.expect,
    android: androidExports.expect,
  },
  element: {
    ios: iosExports.element,
    android: androidExports.element,
  },
  waitFor: {
    ios: iosExports.waitFor,
    android: androidExports.waitFor,
  },
  by: {
    ios: iosExports.by,
    android: androidExports.by,
  }
};

const a = {
  async init(config, params) {
    validateConfig(config);
    await initializeDetox(config, params);
  },

  async cleanup() {
    if (detox) {
      await detox.cleanup();
    }
  },

  async beforeEach() {
    if (detox) {
      await detox.beforeEach.apply(detox, arguments);
    }
  },

  async afterEach() {
    if (detox) {
      await detox.afterEach.apply(detox, arguments);
    }
  },

  element() {
    return exportMap.element[platform.get('name')].apply(null, arguments);
  },

  expect() {
    return exportMap.expect[platform.get('name')].apply(null, arguments);
  },

  waitFor() {
    return exportMap.waitFor[platform.get('name')].apply(null, arguments);
  },
};

module.exports = new Proxy(a, {
  get(map, name) {
    console.log(name);

    if (name === 'by')
      return exportMap.by[platform.get('name')];
    if (name === 'device')
      return platform.get('device');

    return map[name];
  }
});


// module.exports = Object.assign({
//   init,
//   cleanup,
//   beforeEach,
//   afterEach,
// }, exportWrapper);
