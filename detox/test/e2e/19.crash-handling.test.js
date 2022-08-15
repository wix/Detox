const jestExpect = require('expect').default;

const { expectToThrow } = require('./utils/custom-expects');

const relaunchAppWithArgs = (launchArgs) => {
  console.log('Relaunch app with launch-arguments...', launchArgs);
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
    await device.launchApp({newInstance: false});
    await expect(element(by.text('Sanity'))).toBeVisible();
  });

  it(':android: should throw error upon invoke crash', async () => {
    await device.reloadReactNative();
    await expectToThrow(() => element(by.text('UI Crash')).tap(), 'Test Failed: Simulated crash (native)');
  });

  it(':android: Should throw error upon app bootstrap crash', async () => {
    const _relaunchApp = () => relaunchAppWithArgs({ detoxAndroidCrashingActivity: true });

    const error = await expectToThrow(_relaunchApp, 'Failed to run application on the device');

    // It's important that the native-error message (containing the native stack-trace) would also
    // be included in the error, in order for Jest (specifically) to properly output all of that
    // into the shell, as we expect it to.
    jestExpect(error.stack).toEqual(jestExpect.stringContaining('Native stacktrace dump:\njava.lang.RuntimeException:'));
    jestExpect(error.stack).toEqual(jestExpect.stringContaining('\tat android.app'));
    jestExpect(error.stack).toEqual(jestExpect.stringContaining('Caused by: java.lang.IllegalStateException: This is an intentional crash!'));
  }, 60000);
});
