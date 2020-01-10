describe('Sanity', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('correct beforeEach', () => {
    beforeEach(async () => {
      await element(by.text('Sanity')).tap();
    });

    it('but failing test', async () => {
      await expect(element(by.text('Welcome2'))).toBeVisible();
    });
  });

  describe('incorrect beforeEach', () => {
    beforeEach(async () => {
      await element(by.text('Sanity2')).tap();
    });

    it('and test that never ran', async () => {
      await expect(element(by.text('Welcome'))).toBeVisible();
    });
  });
});
