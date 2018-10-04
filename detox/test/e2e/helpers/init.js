const detox = require('detox');
const config = require('../../package.json').detox;
const adapter = require('detox/runners/jest/adapter');

jest.setTimeout(480000);
jasmine.getEnv().addReporter(adapter);

beforeAll(async () => {
  try {
    await detox.init(config);
  } catch (e) {
    await detox.cleanup();
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(1);
  }
});

beforeEach(async function() {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
