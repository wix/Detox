const detox = require('../../src/index');
const config = require('../package.json').detox;

before(async () => {
  detox.config(config);
  await detox.start();
});

after(async () => {
  await detox.cleanup();
});
