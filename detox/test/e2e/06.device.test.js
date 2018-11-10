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

  it('launchApp({newInstance: true}) + sendToHome() + launchApp() - should bring up previous instance', async () => {
    await device.launchApp({newInstance: true});
    await element(by.text('Sanity')).tap();
    await element(by.text('Say Hello')).tap();
    await device.sendToHome();
    await device.launchApp();

    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  // // Passing on iOS, not implemented on Android
  // it('launchApp in a different language', async () => {
  //   let languageAndLocale = {
  //     language: "es-MX",
  //     locale: "es-MX"
  //   };

  //   await device.launchApp({newInstance: true, languageAndLocale});
  //   await element(by.text('Language')).tap();
  //   await expect(element(by.text(`Current locale: ${languageAndLocale.locale}`))).toBeVisible();
  //   await expect(element(by.text(`Current language: ${languageAndLocale.language}`))).toBeVisible();

  //   languageAndLocale = {
  //     language: "en-US",
  //     locale: "en-US"
  //   };

  //   await device.launchApp({newInstance: true, languageAndLocale});
  //   await element(by.text('Language')).tap();
  //   await expect(element(by.text(`Current locale: ${languageAndLocale.locale}`))).toBeVisible();
  //   await expect(element(by.text(`Current language: ${languageAndLocale.language}`))).toBeVisible();
  // });

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
    await expect(element(by.text('Shaken, not stirred'))).toBeVisible();
  });

  it(':ios: iPhone X viewport should equal 1125x2436', async () => {
    const size = await device.getViewportSize();

    if (!size) {
      throw new Error("Could not retrieve viewport size");
    }
    if (size.width !== 1125) {
      throw new Error("Width did not equal 1125");
    }
    if (size.height !== 2436) {
      throw new Error("Height did not equal 2436");
    }
  });

  it(':android: Nexus 5X viewport should equal 1080x1920', async () => {
    const size = await device.getViewportSize();

    if (!size) {
      throw new Error("Could not retrieve viewport size");
    }
    if (size.width !== 1080) {
      throw new Error("Width did not equal 1080");
    }
    if (size.height !== 1920) {
      throw new Error("Height did not equal 1920");
    }
  });

  describe(':android: device back button', () => {
    beforeEach(async() => {
      await device.reloadReactNative();
      await element(by.text('Actions')).tap();
    });

    it(':android: should show popup back pressed when back button is pressed', async () => {
      await device.pressBack();
      await expect(element(by.text('Back pressed !'))).toBeVisible();
    });
  });

});
