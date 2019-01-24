describe('Open URLs', () => {

  const withDefaultArgs = () => ({
    url: 'detoxtesturlscheme://such-string',
    launchArgs: undefined,
  });

  const withAndroidSingleTaskActivityArgs = () => ({
    url: 'detoxtesturlscheme.singletask://such-string',
    launchArgs: Object.freeze({ androidSingleTaskActivity: true }),
  });

  [
    {
      platform: '',
      ...withDefaultArgs(),
    },
    {
      platform: 'android',
      ...withAndroidSingleTaskActivityArgs(),
    }
  ].forEach(({platform, url, launchArgs}) => {

    const _platform = platform ? `:${platform}: ` : '';

    it(`${_platform}device.launchApp() with a URL and a fresh app should launch app and trigger handling open url handling in app`, async () => {
      await device.launchApp({newInstance: true, url, launchArgs});
      await expect(element(by.text(url))).toBeVisible();
    });

    it(`${_platform}device.openURL() should trigger open url handling in app when app is in foreground`, async () => {
      await device.launchApp({newInstance: true, launchArgs});
      await expect(element(by.text(url))).toBeNotVisible();
      await device.openURL({url});
      await expect(element(by.text(url))).toBeVisible();
    });

    it(`${_platform}device.launchApp() with a URL should trigger url handling when app is in background`, async () => {
      await device.launchApp({newInstance: true, launchArgs});
      await expect(element(by.text(url))).toBeNotVisible();
      await device.sendToHome();
      await device.launchApp({newInstance: false, url});
      await expect(element(by.text(url))).toBeVisible();
    });
  });
});
