const { device } = require('detox');

beforeAll(async () => {
  await device.selectApp('example');
  await device.launchApp();
});
