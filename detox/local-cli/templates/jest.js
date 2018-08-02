const firstTestContent = require('./firstTestContent');
const runnerConfig = `{
    "setupTestFrameworkScriptFile": "./init.js",
    "testEnvironment": "node"
}`;

const initjsContent = `const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = runnerConfig;
