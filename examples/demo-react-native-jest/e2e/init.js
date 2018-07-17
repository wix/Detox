const detox = require('detox');
const config = require('../package.json').detox;
const adapter = require('detox/runners/jest/adapter');

// Set the default timeout
jest.setTimeout(120000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async function() {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});
