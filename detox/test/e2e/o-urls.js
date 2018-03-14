describe('Open URLs', () => {

  it('device.launchApp({{newInstance: true, url: url}) should launch app and trigger handling open url handling in app', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.launchApp({newInstance: true, url: url});
    await expect(element(by.text(url))).toBeVisible();
  });

  it('device.openURL({url: url}) should trigger open url handling in app when app is in foreground', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.launchApp({newInstance: true});
    await device.openURL({url: url});
    await expect(element(by.text(url))).toBeVisible();
  });

  it.only('device.launchApp({url: url}) should trigger open url handling in app when app is in background', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.launchApp({newInstance: true});
    await device.sendToHome();
    await device.launchApp({newInstance: false, url: url});
    await expect(element(by.text(url))).toBeVisible();
  });
});
