const { device } = require('detox');

beforeAll(async () => {
  const args = await device.appLaunchArgs.get();
  const isGenymotionDebug = args.detoxIsGenymotionDebug === "true"

  if (isGenymotionDebug) {
    await device.reverseTcpPort(8081);
  }

  await device.selectApp('example');
  await device.launchApp();
});
