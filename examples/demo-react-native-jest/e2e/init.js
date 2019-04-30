const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');
const traceAdapter = require('detox/runners/jest/traceAdapter');

// Set the default timeout
jest.setTimeout(300000);
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
