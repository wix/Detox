describe('Device', () => {
  it('reloadReactNative - should tap successfully', async () => {
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('relaunchApp - should tap successfully', async () => {
    await device.relaunchApp();
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('relaunchApp({delete: true}) - should tap successfully', async () => {
    await device.relaunchApp({delete: true});
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('uninstall() + install() + relaunch() - should tap successfully', async () => {
    await device.uninstallApp();
    await device.installApp();
    await device.relaunchApp();
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('resetAppState() + relaunch() - should tap successfully', async () => {
    await device.resetAppState();
    await device.relaunchApp();
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it.failing('uninstall() + resetAppState() - should fail', async () => {
    try {
      await device.uninstallApp();
      await device.resetAppState();
    } finally {
      await device.installApp();
    }
  });

  it('launchApp({newInstance: true}) + sendToHome() + launchApp() - should bring up previous instance', async () => {
    await device.launchApp({newInstance: true});
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await device.sendToHome();
    await device.launchApp();

    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  // // Passing on iOS, not implemented on Android
  it(':ios: launchApp in a different language', async () => {
    let languageAndLocale = {
      language: "es-MX",
      locale: "en_MX"
    };

    await device.launchApp({newInstance: true, languageAndLocale});
    // iOS toast is hiding the element
    await waitFor(element(by.text('Language'))).toBeVisible().withTimeout(1000);

    await element(by.text('Language')).tap();
    await expect(element(by.text(`Current locale: ${languageAndLocale.locale}`))).toBeVisible();
    await expect(element(by.text(`Current language: ${languageAndLocale.language}`))).toBeVisible();

    languageAndLocale = {
      language: "en-US",
      locale: "en_US"
    };

    await device.launchApp({newInstance: true, languageAndLocale});
    await waitFor(element(by.text('Language'))).toBeVisible().withTimeout(1000);

    await element(by.text('Language')).tap();
    await expect(element(by.text(`Current locale: ${languageAndLocale.locale}`))).toBeVisible();
    await expect(element(by.text(`Current language: ${languageAndLocale.language}`))).toBeVisible();
  });

  it('resetContentAndSettings() + install() + relaunch() - should tap successfully', async () => {
    await device.resetContentAndSettings();
    await device.installApp();
    await device.launchApp({ newInstance: true });
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it(':ios: shake() should shake screen', async () => {
    await device.reloadReactNative();
    await element(by.text('Shake')).tap();
    await device.shake();
    await expect(element(by.text('Shaken, not stirred'))).toExist();
  });

  it(':android: device back button - should show popup back pressed when back button is pressed', async () => {
    await device.reloadReactNative();
    await element(by.text('Actions')).tap();
    await device.pressBack();
    await expect(element(by.text('Back pressed !'))).toBeVisible();
  });
});
