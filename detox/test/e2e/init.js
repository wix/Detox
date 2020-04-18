const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const assignReporter = require('detox/runners/jest/assignReporter');
const timeoutUtils = require('./utils/timeoutUtils');

detoxCircus.getEnv().addEventsListener(adapter);
detoxCircus.getEnv().addEventsListener(assignReporter);
detoxCircus.getEnv().addEventsListener(specReporter);

// Set the default timeout
jest.setTimeout(timeoutUtils.testTimeout);

beforeAll(async () => {
  await detox.init(config);
}, timeoutUtils.initTimeout);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
