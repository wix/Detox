const { device } = require('detox');

beforeAll(async () => {
  await device.relaunchApp();
});
