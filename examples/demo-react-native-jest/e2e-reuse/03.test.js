describe('03 - example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show world screen after tap', async () => {
    await element(by.id('world_button')).tap();
    await expect(element(by.text('World!!!'))).toBeVisible();
  });
});
