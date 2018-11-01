const detox = require('detox/src/index');
const config = require('../package.json').detox;
const adapter = require('detox/runners/mocha/adapter');

before(async () => {
  try {
    await detox.init(config);
  } catch (e) {
    await detox.cleanup();
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(1);
  }
});

beforeEach(async function () {
  await adapter.beforeEach(this);
});

afterEach(async function () {
  await adapter.afterEach(this);
});

after(async () => {
  await detox.cleanup();
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
