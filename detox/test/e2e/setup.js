const { device } = require('detox');
require('./utils/custom-describes');

beforeAll(async () => {
  await device.selectApp('example');
  await device.launchApp();
});
