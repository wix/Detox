const { launchArgsDriver: driver } = require('./drivers/launch-args-driver');

// Note: Android-only as, according to Leo, on iOS there's no added value here compared to
// existing tests that check deep-link URLs. Combined with the fact that we do not yet
// support complex args on iOS -- no point in testing it out.
describe(':android: Launch arguments', () => {
  const defaultArgs = Object.freeze({
    app: 'le',
    goo: 'gle?',
    micro: 'soft'
  });

  beforeEach(async () => {
    await device.selectApp('exampleWithArgs');
    driver.assertPreconfiguredValues(device.appLaunchArgs.get(), defaultArgs);
  });

  it('should preserve a shared arg in spite of app reselection', async () => {
    const override = { ama: 'zed' };

    try {
      driver.assertPreconfiguredValues(device.appLaunchArgs.get(), defaultArgs);
      driver.assertPreconfiguredValues(device.appLaunchArgs.shared.get(), {});
      device.appLaunchArgs.shared.modify(override);

      driver.assertPreconfiguredValues(device.appLaunchArgs.get(), { ...defaultArgs, ...override });
      driver.assertPreconfiguredValues(device.appLaunchArgs.shared.get(), override);

      await device.selectApp('example');
      driver.assertPreconfiguredValues(device.appLaunchArgs.get(), override);
      driver.assertPreconfiguredValues(device.appLaunchArgs.shared.get(), override);

      await device.launchApp({ newInstance: true });
      await driver.navToLaunchArgsScreen();
      await driver.assertLaunchArgs(override);
    } finally {
      device.appLaunchArgs.shared.reset();
    }
  });

  it('should handle primitive args when used on-site', async () => {
    const launchArgs = {
      hello: 'world',
      seekthe: true,
      heisthe: 1,
    };

    await device.launchApp({ newInstance: true, launchArgs });
    await driver.navToLaunchArgsScreen();
    await driver.assertLaunchArgs(launchArgs);
  });

  it('should handle complex args when used on-site', async () => {
    const launchArgs = {
      complex: {
        bull: ['s', 'h', 1, 't'],
        and: {
          then: 'so, me',
        }
      },
      complexlist: ['arguments', 'https://haxorhost:1337'],
    };

    await device.launchApp({ newInstance: true, launchArgs });
    await driver.navToLaunchArgsScreen();
    await driver.assertLaunchArgs({
      complex: JSON.stringify(launchArgs.complex),
      complexlist: JSON.stringify(launchArgs.complexlist),
    });
  });

  it('should allow for arguments modification', async () => {
    device.appLaunchArgs.modify({
      app: undefined, // delete
      goo: 'gle!', // modify
      ama: 'zon', // add
    });

    await device.launchApp({ newInstance: true });
    await driver.navToLaunchArgsScreen();
    await driver.assertLaunchArgs({
      'goo': 'gle!',
      'ama': 'zon',
      'micro': 'soft',
    }, ['app']);
  });

  it('should allow for on-site arguments to take precedence', async () => {
    const launchArgs = {
      anArg: 'aValue!',
    };

    device.appLaunchArgs.reset();
    device.appLaunchArgs.modify({
      anArg: 'aValue?',
    });

    await device.launchApp({ newInstance: true, launchArgs });
    await driver.navToLaunchArgsScreen();
    await driver.assertLaunchArgs({ anArg: 'aValue!' });
  });

  // Ref: https://developer.android.com/studio/test/command-line#AMOptionsSyntax
  it('should not pass android instrumentation args through', async () => {
    const launchArgs = {
      hello: 'world',
      debug: false,
      log: false,
      size: 'large',
    };

    await device.launchApp({ newInstance: true, launchArgs });
    await driver.navToLaunchArgsScreen();
    await driver.assertLaunchArgs({ hello: 'world' }, ['debug', 'log', 'size']);
  });
});
