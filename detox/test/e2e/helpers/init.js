const detox = require('detox');
const config = require('../../package.json').detox;
jest.setTimeout(480000);

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});

beforeEach(async function() {
  await detox.beforeEach(jasmine.testPath);
});

afterEach(async function() {
  await detox.afterEach(jasmine.testPath);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});