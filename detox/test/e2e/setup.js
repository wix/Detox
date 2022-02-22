const { device } = require('detox');

beforeAll(async () => {
  await device.reverseTcpPort(8081);
  await device.selectApp('example');
  await device.launchApp();
});
