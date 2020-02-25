describe('Crash Handling', () => {
  afterAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: undefined,
    });
  });

  it('Should throw error upon internal app crash', async () => {
    await device.reloadReactNative();
    let failed = false;

    try {
      await element(by.text('Crash')).tap();
      await element(by.text('Crash')).tap();
    } catch (ex) { // Note: exception will be logged as an APP_CRASH event
      failed = true;
    }

    if (!failed) throw new Error('Test should have thrown an error, but did not');
  });

  it('Should recover from app crash', async () => {
    await device.launchApp({newInstance: false});
    await expect(element(by.text('Sanity'))).toBeVisible();
  });

  it(':android: should throw error upon invoke crash', async () => {
    await device.reloadReactNative();
    let failed = false;

    try {
      await element(by.text('UI Crash')).tap();
    } catch (ex) {
      console.error(ex); // Log explicitly or it wouldn't show
      failed = true;
    }

    if (!failed) throw new Error('Test should have thrown an error, but did not');
  });

  it(':android: Should throw error upon app bootstrap crash', async () => {
    let failed = false;
    try {
      await device.launchApp({ newInstance: true, launchArgs: { detoxAndroidCrashingActivity: true }});
    } catch (ex) {
      console.error(ex); // Log explicitly or it wouldn't show
      failed = true;
    }

    // This is not effectively needed, as if crash handling doesn't go right launchApp would typically
    // just hang forever (and thus a timeout will fail the test - not this assertion).
    if (!failed) throw new Error('Test should have thrown an error, but did not');
  }, 60000);
});
