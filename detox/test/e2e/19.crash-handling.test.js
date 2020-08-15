describe('Crash Handling', () => {
  afterAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: undefined,
    });
  });

  it('Should throw error upon internal app crash', async () => {
    await device.reloadReactNative();

    try {
      await element(by.text('Crash')).tap();
      await element(by.text('Crash')).tap();
      fail('Test should have thrown an error, but did not');
    } catch (_ex) {
      // Note: exception will be logged as an APP_CRASH event
    }
  });

  it('Should recover from app crash', async () => {
    await device.launchApp({newInstance: false});
    await expect(element(by.text('Sanity'))).toBeVisible();
  });

  it(':android: should throw error upon invoke crash', async () => {
    await device.reloadReactNative();

    try {
      await element(by.text('UI Crash')).tap();
      fail('Test should have thrown an error, but did not');
    } catch (ex) {
      console.error(ex); // Log explicitly or it wouldn't show
    }
  });

  it(':android: Should throw error upon app bootstrap crash', async () => {
    try {
      await device.launchApp({ newInstance: true, launchArgs: { detoxAndroidCrashingActivity: true }});
      fail('Test should have thrown an error, but did not');
    } catch (ex) {
      console.error(ex); // Log explicitly or it wouldn't show
    }

    // This is not effectively needed, as if crash handling doesn't go right launchApp would typically
    // just hang forever (and thus a timeout will fail the test - not this assertion).
  }, 60000);
});
