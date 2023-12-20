const { urlDriver } = require('./drivers/url-driver');
const { launchArgsDriver } = require('./drivers/launch-args-driver');

describe(':android: Launch arguments while handing launch URLs', () => {
  it('should pass user args in normally', async () => {
    const userArgs = {
      how: 'about some',
      pie: '3.14',
    };
    const detoxLaunchArgs = urlDriver.withDetoxArgs.andUserArgs(userArgs);

    await device.launchApp({ newInstance: true, ...detoxLaunchArgs });
    await urlDriver.navToUrlScreen();
    await urlDriver.assertUrl(detoxLaunchArgs.url);

    await device.reloadReactNative();
    await launchArgsDriver.navToLaunchArgsScreen();
    await launchArgsDriver.assertLaunchArgs(userArgs);
  });
});
