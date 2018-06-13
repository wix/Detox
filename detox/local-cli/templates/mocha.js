const firstTestContent = require('./firstTestContent');
const mochaOptsContent = '--recursive --timeout 120000 --bail';
const initjsContent = `const detox = require('detox');
const config = require('../package.json').detox;

before(async () => {
  await detox.init(config);
});

beforeEach(async function () {
  await adapter.beforeEach.mocha(this);
});

afterEach(async function () {
  await adapter.afterEach.mocha(this);
});

after(async () => {
  await detox.cleanup();
});`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = mochaOptsContent;
