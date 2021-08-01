const { expectToThrow } = require('./utils/custom-expects');

describe('Crash Handling', () => {
  afterAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: undefined,
    });
  });

  it('Should throw error upon internal app crash', async () => {
    await device.reloadReactNative();
    await expectToThrow(() => element(by.text('Crash')).tap(), 'The app has crashed');
    await expectToThrow(() => element(by.text('Crash')).tap(), 'Detox can\'t seem to connect to the test app(s)!');
  });

  it('Should recover from app crash', async () => {
    await device.launchApp({newInstance: false});
    await expect(element(by.text('Sanity'))).toBeVisible();
  });

  it(':android: should throw error upon invoke crash', async () => {
    await device.reloadReactNative();
    await expectToThrow(() => element(by.text('UI Crash')).tap(), 'Test Failed: Simulated crash (native)');
  });

  it(':android: Should throw error upon app bootstrap crash', async () => {
    await expectToThrow(() => device.launchApp({
      newInstance: true,
      launchArgs: { detoxAndroidCrashingActivity: true }
    }), 'Failed to run application on the device');

    // This is not effectively needed, as if crash handling doesn't go right launchApp would typically
    // just hang forever (and thus a timeout will fail the test - not this assertion).
  }, 60000);
});
