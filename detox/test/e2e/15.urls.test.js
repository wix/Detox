describe('Open URLs', () => {

  const testUrl = 'detoxtesturlscheme://such-string';

  it('device.launchApp() with a URL and a fresh app should launch app and trigger handling open url handling in app', async () => {
    await device.launchApp({newInstance: true, url: testUrl});
    await expect(element(by.text(testUrl))).toBeVisible();
  });

  it(':android: device.launchApp() with a URL and a fresh app should launch app properly also in single-task activities', async () => {
    await device.launchApp({newInstance: true, url: testUrl, launchArgs: {androidSingleTaskActivity: true}});
    await expect(element(by.text(testUrl))).toBeVisible();
  });

  it('device.openURL() should trigger open url handling in app when app is in foreground', async () => {
    await device.launchApp({newInstance: true});
    await device.openURL({url: testUrl});
    await expect(element(by.text(testUrl))).toBeVisible();
  });

  it(':android: device.openURL() should should work properly also in single-task activities', async () => {
    await device.launchApp({newInstance: true, launchArgs: {androidSingleTaskActivity: true}});
    await device.openURL({url: testUrl});
    await expect(element(by.text(testUrl))).toBeVisible();
  });

  it('device.launchApp() with a URL should trigger url handling when app is in background', async () => {
    await device.launchApp({newInstance: true});
    await device.sendToHome();
    await device.launchApp({newInstance: false, url: testUrl});
    await expect(element(by.text(testUrl))).toBeVisible();
  });

  it(':android: device.launchApp() with a URL should work properly also in single-task activities', async () => {
    await device.launchApp({newInstance: true, launchArgs: {androidSingleTaskActivity: true}});
    await device.sendToHome();
    await device.launchApp({newInstance: false, url: testUrl});
    await expect(element(by.text(testUrl))).toBeVisible();
  });
});
