
describe.only('Crash Handling, not to be ran on CI', () => {

  beforeEach(async () => {
    await device.launchApp({newInstance: false});
  });

  it('Should throw error upon app crash', async () => {
    let failed = false;

    await element(by.text('Crash')).tap();
    try {
      await expect(element(by.text('Crash'))).toBeVisible();
    } catch(ex) {
      failed = true;
    }

    if (!failed) throw new Error('Test should have thrown an error, but did not');
  });

  it('Should recover from app crash', async () => {
    await expect(element(by.text('Sanity'))).toBeVisible();
  });
});