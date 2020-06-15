// Note: Android-only as, according to Leo, on iOS there's no added value here compared to
// existing tests that check deep-link URLs. Combined with the fact that we do not yet
// support complex args on iOS -- no point in testing it out.
describe(':android: Launch arguments', () => {
  async function assertLaunchArg(key, expectedValue) {
    await expect(element(by.id(`launchArg-${key}.name`))).toBeVisible();
    await expect(element(by.id(`launchArg-${key}.value`))).toHaveText(expectedValue);
  }

  async function assertNoLaunchArg(launchArgKey) {
    await expect(element(by.id(`launchArg-${launchArgKey}.name`))).toBeNotVisible();
  }

  it('should handle primitive args', async () => {
    const launchArgs = {
      hello: 'world',
      seekthe: true,
      heisthe: 1,
    };

    await device.launchApp({newInstance: true, launchArgs});

    await element(by.text('Launch Args')).tap();
    await assertLaunchArg('hello', 'world');
    await assertLaunchArg('seekthe', 'true');
    await assertLaunchArg('heisthe', '1');
  });

  it('should handle complex args', async () => {
    const launchArgs = {
      complex: {
        bull: ['s', 'h', 1, 't'],
        and: {
          then: 'so, me',
        }
      },
      complexlist: ['arguments', 'https://haxorhost:666'],
    };

    await device.launchApp({newInstance: true, launchArgs});

    await element(by.text('Launch Args')).tap();

    await assertLaunchArg('complex', JSON.stringify(launchArgs.complex));
    await assertLaunchArg('complexlist', JSON.stringify(launchArgs.complexlist));
  });

  // Ref: https://developer.android.com/studio/test/command-line#AMOptionsSyntax
  it('should not pass android instrumentation args through', async () => {
    const launchArgs = {
      hello: 'world',
      debug: false,
      log: false,
      size: 'large',
    };

    await device.launchApp({newInstance: true, launchArgs});

    await element(by.text('Launch Args')).tap();
    await assertLaunchArg('hello', 'world');
    await assertNoLaunchArg('debug');
    await assertNoLaunchArg('log');
    await assertNoLaunchArg('size');
  });
});
