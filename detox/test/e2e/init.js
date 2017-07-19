const detox = require('../../src/index');
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});

after(async () => {
  await detox.cleanup();
});

beforeEach(async function() {
  await detox.beforeEach(this.currentTest.parent.title, this.currentTest.title);
});

afterEach(async function() {
  await detox.afterEach();
});