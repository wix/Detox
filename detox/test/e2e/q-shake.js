describe('Shake', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Shake')).tap();
  });

  it.only('should shake screen', async () => {
    await device.shake();
    await expect(element(by.text('Shaken, not stirred'))).toBeVisible();
  });
});
