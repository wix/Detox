describe('Crash Handling', () => {
  it('Should throw error upon app crash', async () => {
    await device.launchApp({newInstance: true});

    let failed = false;

    try {
      await element(by.text('Crash')).tap();
      await element(by.text('Crash')).tap();
    } catch (ex) {
      failed = true;
    }

    if (!failed) throw new Error('Test should have thrown an error, but did not');
  });

  it('Should recover from app crash', async () => {
    await device.launchApp({newInstance: false});
    await expect(element(by.text('Sanity'))).toBeVisible();
  });
});
