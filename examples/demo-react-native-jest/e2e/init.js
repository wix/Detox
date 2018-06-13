const detox = require('detox');
const config = require('../package.json').detox;

// Set the default timeout
jest.setTimeout(120000);

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async function() {
  await detox.beforeEach.jest();
});

afterAll(async () => {
  await detox.cleanup.jest();
});
