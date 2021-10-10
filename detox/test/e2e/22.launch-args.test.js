/* global by, device, element */
const _ = require('lodash');

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
    assertPreconfiguredValues(device.appLaunchArgs.get(), defaultArgs);
  });

  it('should have permanent arg in spite of .selectApp()', async () => {
    try {
      assertPreconfiguredValues(device.appLaunchArgs.get({ permanent: true }), {});
      device.appLaunchArgs.modify({ ama: 'zed' }, { permanent: true });
      assertPreconfiguredValues(device.appLaunchArgs.get({ permanent: true }), { ama: 'zed' });

      await device.selectApp('example');
      assertPreconfiguredValues(device.appLaunchArgs.get(), { ama: 'zed' });
      assertPreconfiguredValues(device.appLaunchArgs.get({ permanent: false }), {});

      await device.launchApp({ newInstance: true });
      await assertLaunchArgs({ ama: 'zed' });
    } finally {
      device.appLaunchArgs.reset({ permanent: true });
    }
  });

  it('should handle primitive args when used on-site', async () => {
    const launchArgs = {
      hello: 'world',
      seekthe: true,
      heisthe: 1,
    };

    await device.launchApp({ newInstance: true, launchArgs });
    await assertLaunchArgs(launchArgs);
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
    await assertLaunchArgs({
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
    await assertLaunchArgs({
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
    await assertLaunchArgs({ anArg: 'aValue!' });
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
    await assertLaunchArgs({ hello: 'world' }, ['debug', 'log', 'size']);
  });

  async function assertLaunchArgs(expected, notExpected) {
    await element(by.text('Launch Args')).tap();

    if (expected) {
      for (const [key, value] of Object.entries(expected)) {
        await expect(element(by.id(`launchArg-${key}.name`))).toBeVisible();
        await expect(element(by.id(`launchArg-${key}.value`))).toHaveText(`${value}`);
      }
    }

    if (notExpected) {
      for (const key of notExpected) {
        await expect(element(by.id(`launchArg-${key}.name`))).not.toBeVisible();
      }
    }
  }

  function assertPreconfiguredValues(initArgs, expectedInitArgs) {
    if (!_.isEqual(initArgs, expectedInitArgs)) {
      throw new Error(
        `Precondition failure: Preconfigured launch arguments (in detox.config.js) do not match the expected value.\n` +
        `Expected: ${JSON.stringify(expectedInitArgs)}\n` +
        `Received: ${JSON.stringify(initArgs)}`
      );
    }
  }
});
