const firstTestContent = require('./firstTestContent');
const runnerConfig = `{
    "setupFilesAfterEnv": ["./init.js"],
    "testEnvironment": "node",
    "reporters": ["detox/runners/jest/streamlineReporter"],
    "verbose": true
}
`;

const initjsContent = `const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');

// Set the default timeout
jest.setTimeout(120000);

jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-spec basis. By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(specReporter);

beforeAll(async () => {
  await detox.init();
}, 300000);

beforeEach(async () => {
  try {
    await adapter.beforeEach();
  } catch (err) {
    // Workaround for the 'jest-jasmine' runner (default one): if 'beforeAll' hook above fails with a timeout,
    // unfortunately, 'jest' might continue running other hooks and test suites. To prevent that behavior,
    // adapter.beforeEach() will throw if detox.init() is still running; that allows us to run detox.cleanup()
    // in that emergency case and disable calling 'device', 'element', 'expect', 'by' and other Detox globals.
    // If you switch to 'jest-circus' runner, you can omit this try-catch workaround at all.

    await detox.cleanup();
    throw err;
  }
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = runnerConfig;
