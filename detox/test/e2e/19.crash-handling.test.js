const jestExpect = require('expect').default;

const { expectToThrow } = require('./utils/custom-expects');

const relaunchAppWithArgs = (launchArgs) => {
  console.log('Relaunching app with launch-arguments...', launchArgs);
  return device.launchApp({
    newInstance: true,
    launchArgs,
  })
};

describe('Crash Handling', () => {
  afterAll(async () => {
    await relaunchAppWithArgs(undefined);
  });

  it('Should throw error upon internal app crash', async () => {
    await device.reloadReactNative();
    await expectToThrow(() => element(by.text('Crash')).tap(), 'The app has crashed');
    await expectToThrow(() => element(by.text('Crash')).tap(), 'Detox can\'t seem to connect to the test app(s)!');
  });

  it('Should recover from app crash', async () => {
    await device.launchApp({ newInstance: false });
    await expect(element(by.text('Sanity'))).toBeVisible();
  });

  it('Should throw a detailed error upon early app crash', async () => {
    const error = await expectToThrow(
      () => relaunchAppWithArgs({ simulateEarlyCrash: true }),
      'The app has crashed');

    // It's important that the native-error message (containing the native stack-trace) would also
    // be included in the error's stack property, in order for Jest (specifically) to properly output all
    // of that into the shell, as we expect it to.
    jestExpect(error.stack).toContain('Simulating early crash');

    if (device.getPlatform() === 'android') {
      jestExpect(error.stack).toContain('\tat java.lang.Thread.run');
    } else {
      jestExpect(error.stack).toContain('\t0   CoreFoundation');
    }
  });

  it(':android: should throw error upon invoke crash', async () => {
    await device.launchApp({ newInstance: true });
    await expectToThrow(() => element(by.text('UI Crash')).tap(), 'Test Failed: Simulated crash (native)');
  });

  it(':android: Should throw a detailed error upon app bootstrap crash', async () => {
    const error = await expectToThrow(
      () => relaunchAppWithArgs({ detoxAndroidCrashingActivity: true }),
      'Failed to run application on the device');

    // It's important that the native-error message (containing the native stack-trace) would also
    // be included in the error's stack property, in order for Jest (specifically) to properly output all
    // of that into the shell, as we expect it to.
    jestExpect(error.stack).toContain('Native stacktrace dump:\njava.lang.RuntimeException:');
    jestExpect(error.stack).toContain('\tat android.app');
    jestExpect(error.stack).toContain('Caused by: java.lang.IllegalStateException: This is an intentional crash!');
  }, 60000);
});
