describe('Open URLs', () => {
  afterAll(async () => {
    await device.launchApp({
      newInstance: true,
      url: undefined,
      launchArgs: undefined,
    });
  });

  const withDefaultArgs = () => ({
    url: 'detoxtesturlscheme://such-string?arg1=first&arg2=second',
    launchArgs: undefined,
  });

  const withSingleInstanceActivityArgs = () => ({
    url: 'detoxtesturlscheme.singleinstance://such-string',
    launchArgs: { detoxAndroidSingleInstanceActivity: true },
  });

  describe.each([
    ['(default)', withDefaultArgs()],
    [':android: (single activity)', withSingleInstanceActivityArgs()],
  ])('%s', (_platform, {url, launchArgs}) => {
    it(`device.launchApp() with a URL and a fresh app should launch app and trigger handling open url handling in app`, async () => {
      await device.launchApp({newInstance: true, url, launchArgs});
      await expect(element(by.text(url))).toBeVisible();
    });

    it(`device.openURL() should trigger open url handling in app when app is in foreground`, async () => {
      await device.launchApp({newInstance: true, launchArgs});
      await expect(element(by.text(url))).not.toBeVisible();
      await device.openURL({url});
      await expect(element(by.text(url))).toBeVisible();
    });

    it(`device.launchApp() with a URL should trigger url handling when app is in background`, async () => {
      await device.launchApp({newInstance: true, launchArgs});
      await expect(element(by.text(url))).not.toBeVisible();
      await device.sendToHome();
      await device.launchApp({newInstance: false, url});
      await expect(element(by.text(url))).toBeVisible();
    });
  });
});
