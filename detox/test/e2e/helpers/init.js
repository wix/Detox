const detox = require('detox');
const config = require('../../package.json').detox;

jest.setTimeout(480000);

beforeAll(async () => {
  await detox.init(config);
});

beforeEach(async function() {
  await detox.beforeEach.jest();
});

afterAll(async () => {
  await detox.cleanup.jest();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
