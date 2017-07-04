describe('Deep Links', () => {

  it('relaucnhApp({url: url}) should launch app and trigger handling of deep links in app', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.relaunchApp({url: url});
    await expect(element(by.label(url))).toBeVisible();
  });

  it('device.openURL({url: url}) should trigger handling of deep links in app when app is in foreground', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.relaunchApp();
    await device.openURL({url: url});
    await expect(element(by.label(url))).toBeVisible();
  });
});
