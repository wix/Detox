// Note: Android-only as, according to Leo, on iOS there's no added value here compared to
// existing tests that check deep-link URLs. Combined with the fact that we do not yet
// support complex args on iOS -- no point in testing it out.
describe(':android: Launch arguments', () => {
  async function assertLaunchArg(launchArgs, key, expectedValue) {
    await expect(element(by.id(`launchArg-${key}.name`))).toBeVisible();
    await expect(element(by.id(`launchArg-${key}.value`))).toHaveText(expectedValue);
  }

  it('should handle primitive args', async () => {
    const launchArgs = {
      hello: 'world',
      seekthe: true,
      heisthe: 1,
    };

    await device.launchApp({newInstance: true, launchArgs});

    await element(by.text('Launch Args')).tap();
    await assertLaunchArg(launchArgs, 'hello', 'world');
    await assertLaunchArg(launchArgs, 'seekthe', 'true');
    await assertLaunchArg(launchArgs, 'heisthe', '1');
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

    await assertLaunchArg(launchArgs, 'complex', JSON.stringify(launchArgs.complex));
    await assertLaunchArg(launchArgs, 'complexlist', JSON.stringify(launchArgs.complexlist));
  });
});
