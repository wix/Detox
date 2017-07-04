describe.only('Deep Links', () => {

  it('relaucnhApp({url: url}) should pass to app', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.relaunchApp({url: url});
    await expect(element(by.label(url))).toBeVisible();
  });

  it('device.openURL({url: url}) should', async () => {
    const url = 'detoxtesturlscheme://such-string';
    await device.relaunchApp();

    await device.openURL({url: url});
    await expect(element(by.label(url))).toBeVisible();
  });
});


async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}