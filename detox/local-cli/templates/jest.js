const firstTestContent = require('./firstTestContent');
const runnerConfig = `{
    "setupFilesAfterEnv": ["./init.js"],
    "testEnvironment": "node",
    "reporters": ["detox/runners/jest/DetoxJestReporter.js"],
    "verbose": true
}
`;

const initjsContent = `const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const traceAdapter = require('detox/runners/jest/traceAdapter');

// Set the default timeout
jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

// This takes care of generating status logs on a per-test basis.
// By default, jest only reports at file-level.
// This is strictly optional.
jasmine.getEnv().addReporter(traceAdapter);

beforeAll(async () => {
  await adapter.beforeAll(config);
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
});
`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = runnerConfig;
