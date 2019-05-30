describe('Open URLs', () => {
  afterAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: undefined,
      launchArgs: undefined,
    });
  });

  const withDefaultArgs = () => ({
    url: 'detoxtesturlscheme://such-string',
    launchArgs: undefined,
  });

  const withSingleInstanceActivityArgs = () => ({
    url: 'detoxtesturlscheme.singleinstance://such-string',
    launchArgs: { androidSingleInstanceActivity: true },
  });

  [
    {
      platform: '',
      ...withDefaultArgs(),
    },
    {
      platform: 'android',
      ...withSingleInstanceActivityArgs(),
    }
  ].forEach((testSpec) => {
    const {platform, url, launchArgs} = testSpec;
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
