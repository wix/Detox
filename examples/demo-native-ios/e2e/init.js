const detox = require('detox');

before(async () => {
  await detox.init();
});

after(async () => {
  await detox.cleanup();
});
