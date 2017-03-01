const log = require('npmlog');
const Simulator = require('./devices/simulator');
const argparse = require('./utils/argparse');
const InvocationManager = require('./invoke').InvocationManager;
const configuration = require('./configuration');
const Client = require('./client/client');

log.level = argparse.getArgValue('loglevel') || 'info';
log.heading = 'detox';

let client;
let _detoxConfig;
let expect;

function config(detoxConfig) {
  configuration.validateConfig(detoxConfig);
  _detoxConfig = detoxConfig || configuration.defaultConfig;
}

async function start() {
  client = new Client(_detoxConfig.session);
  client.connect();

  await initDevice();

  const invocationManager = new InvocationManager(client);
  expect.setInvocationManager(invocationManager);
}

async function cleanup() {
  await client.cleanup();
}

async function openURL(url) {
  await device.openURL(url);
}

async function initDevice() {
  const device = argparse.getArgValue('device');
  switch (device) {
    case 'ios.simulator':
      await initIosSimulator();
      break;
    case 'ios.device':
      await initIosDevice();
      break;
    case 'android.emulator':
    case 'android.device':
      throw new Error(`Can't run ${device}, Android is not yet supported`);
    default:
      log.warn(`No target selected, defaulting to iOS Simulator!`);
      await initIosSimulator();
      break;
  }
}

async function initIosSimulator() {
  expect = require('./ios/expect');
  expect.exportGlobals();
  await setDevice(Simulator);
}

async function initIosDevice() {
  expect = require('./ios/expect');
  expect.exportGlobals();
}

async function setDevice(device) {
  global.device = new device(client, _detoxConfig);
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
  cleanup,
  openURL
};
