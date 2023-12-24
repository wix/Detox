const { urlDriver } = require('./drivers/url-driver');

describe('Open URLs', () => {
  afterAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: undefined,
      launchArgs: undefined,
    });
  });

  describe.each([
    ['(default)', urlDriver.withDetoxArgs.default()],
    [':android: (single activity)', urlDriver.withDetoxArgs.forSingleInstanceActivityLaunch()],
  ])('%s', (_platform, {url, launchArgs}) => {
    it(`device.launchApp() with a URL and a fresh app should launch app and trigger handling open url handling in app`, async () => {
      await device.launchApp({newInstance: true, url, launchArgs});
      await urlDriver.navToUrlScreen();
      await urlDriver.assertUrl(url);
    });

    it(`device.openURL() should trigger open url handling in app when app is in foreground`, async () => {
      await device.launchApp({newInstance: true, launchArgs});
      await urlDriver.navToUrlScreen();
      await urlDriver.assertNoUrl(url);
      await device.openURL({url});
      await urlDriver.assertUrl(url);
    });

    it(`device.launchApp() with a URL should trigger url handling when app is in background`, async () => {
      await device.launchApp({newInstance: true, launchArgs});
      await urlDriver.navToUrlScreen();
      await urlDriver.assertNoUrl(url);
      await device.sendToHome();
      await device.launchApp({newInstance: false, url});
      await urlDriver.assertUrl(url);
    });
  });
});
