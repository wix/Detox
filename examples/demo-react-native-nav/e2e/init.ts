import detox from 'detox';
import adapter from 'detox/runners/mocha/adapter';

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
