describe('Sync', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Sync')).tap();
  });

  it('should show activity indicator without stucking', async () => {
    await element(by.id('showIndicator')).tap();
    await expect(element(by.id('indicator'))).toBeVisible();
  });
});
