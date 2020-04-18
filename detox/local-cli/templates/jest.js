const firstTestContent = require('./firstTestContent');
const runnerConfig = `{
    "setupFilesAfterEnv": ["./init.js"],
    "testEnvironment": "detox/runners/jest/environment",
    "testRunner": "jest-circus/runner",
    "reporters": ["detox/runners/jest/streamlineReporter"],
    "verbose": true
}
`;

const initjsContent = `const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');

detoxCircus.getEnv().addEventsListener(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
detoxCircus.getEnv().addEventsListener(specReporter);

// Set the default timeout
jest.setTimeout(90000);

beforeAll(async () => {
  await detox.init(config);
}, 300000);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = runnerConfig;
