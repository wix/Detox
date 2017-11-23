const detox = require('detox');
const config = require('../package.json').detox;

// Set the default timeout
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});
