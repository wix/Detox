const firstTestContent = require('./firstTestContent');

const mochaRcContent = JSON.stringify({
  recursive: true,
  timeout: 120000,
  bail: true,
  file: 'e2e/init.js',
}, null, 4);

const initjsContent = `const detox = require('detox');
const adapter = require('detox/runners/mocha/adapter');

before(async () => {
  await detox.init();
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
`;

exports.initjs = initjsContent;
exports.firstTest = firstTestContent;
exports.runnerConfig = mochaRcContent;
