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
  });

  it('Should throw the same crash error even in the next test if the app was not relaunched', async () => {
    await expectToThrow(() => element(by.text('Crash')).tap(), 'The app has crashed');
  });

  it('Should recover from app crash', async () => {
    await device.launchApp({ newInstance: false });
    await expect(element(by.text('Sanity'))).toBeVisible();
  });

  /**
   * @issue 4377
   * @tag flaky
   */
  it('Should print generic connectivity error when the app was terminated intentionally', async () => {
    await device.terminateApp();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // see the issue for details
    await expectToThrow(() => element(by.text('Crash')).tap(), 'Detox can\'t seem to connect to the test app(s)!');
  });

  it('@legacy Should throw a detailed error upon early app crash', async () => {
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
      jestExpect(error.stack).toContain('JS Exception');
    }
  });

  it(':android: should throw error upon invoke crash', async () => {
    await device.launchApp({ newInstance: true });
    await expectToThrow(() => element(by.text('UI Crash')).tap(), 'Test Failed: Simulated crash (native)');
  });

  it(':android: Should throw a detailed error upon app bootstrap crash', async () => {
    const error = await expectToThrow(
      () => relaunchAppWithArgs({ detoxAndroidCrashingActivity: true }),
      'The app has crashed, see the details below:');

    // It's important that the native-error message (containing the native stack-trace) would also
    // be included in the error's stack property, in order for Jest (specifically) to properly output all
    // of that into the shell, as we expect it to.
    jestExpect(error.stack).toContain('java.lang.RuntimeException: Unable to resume activity');

    // In particular, we want the original cause to be bundled in.
    jestExpect(error.stack).toContain('Caused by: java.lang.IllegalStateException: This is an intentional crash!');
  }, 60000);
});
