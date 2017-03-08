const log = require('npmlog');
const Simulator = require('./devices/simulator');
const Device = require('./devices/device');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;
const configuration = require('./configuration');
const Client = require('./client/client');
const DetoxServer = require('detox-server');
const URL = require('url').URL;
const _ = require('lodash');

log.level = argparse.getArgValue('loglevel') || 'info';
log.heading = 'detox';

let client;
let detoxConfig;
let expect;

async function config(userConfig) {
  if (userConfig && userConfig.session) {
    configuration.validateSession(userConfig);
    detoxConfig = userConfig;
  } else {
    detoxConfig = _.merge(await configuration.defaultConfig(), userConfig);
    const server = new DetoxServer(new URL(detoxConfig.session.server).port);
  }
}

async function start() {
  client = new Client(detoxConfig.session);
  const _connect = client.connect();
  const _initDevice = initDevice();

  expect = require('./ios/expect');
  expect.exportGlobals();
  const invocationManager = new InvocationManager(client);
  expect.setInvocationManager(invocationManager);

  await Promise.all([_initDevice]);
}

async function cleanup() {
  await client.cleanup();
}

async function initDevice() {
  const device = argparse.getArgValue('device');
  switch (device) {
    case 'ios.simulator':
      await initIosSimulator();
      break;
    case 'ios.device':
      throw new Error(`Can't run ${device}, iOS physical devices are not yet supported`);
    case 'android.emulator':
    case 'android.device':
      throw new Error(`Can't run ${device}, Android is not yet supported`);
    case 'none':
      //await initGeneralDevice();
      break;
    default:
      break;
  }
}

async function initIosSimulator() {
  expect = require('./ios/expect');
  expect.exportGlobals();
  await setDevice(Simulator);
}

async function initGeneralDevice() {
  expect = require('./ios/expect');
  expect.exportGlobals();
  await setDevice(Device);
}

async function setDevice(device) {
  global.device = new device(client, detoxConfig);
  await global.device.prepare();
}

// if there's an error thrown, close the websocket,
// if not, mocha will continue running until reaches timeout.
process.on('uncaughtException', (err) => {
  //client.close();

  throw err;
});

process.on('unhandledRejection', (reason, p) => {
  //client.close();

  throw reason;
});

module.exports = {
  config,
  start,
  cleanup
};
