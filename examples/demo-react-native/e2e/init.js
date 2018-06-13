const detox = require('detox');
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});

beforeEach(async function () {
  await detox.beforeEach.mocha(this);
});

afterEach(async function () {
  await detox.afterEach.mocha(this);
});

after(async () => {
  await detox.cleanup();
});
