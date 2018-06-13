const firstTestContent = require('./firstTestContent');
const runnerConfig = `{
    "setupTestFrameworkScriptFile": "./init.js"
}`;

const initjsContent = `const detox = require('detox');
const config = require('../package.json').detox;

jest.setTimeout(120000);

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async () => {
  await adapter.beforeEach.jest();
});

afterAll(async () => {
  await detox.cleanup.jest();
});`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = runnerConfig;
