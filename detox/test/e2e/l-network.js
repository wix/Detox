describe.only('Network Synchronization', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.label('Network')).tap();
  });

  it('Sync with short network requests - 100ms', async () => {
    await element(by.id('ShortNetworkRequest')).tap();
    await expect(element(by.label('Short Network Request Working!!!'))).toBeVisible();
  });

  it('Sync with long network requests - 3000ms', async () => {
    await element(by.id('LongNetworkRequest')).tap();
    await expect(element(by.label('Long Network Request Working!!!'))).toBeVisible();
  });
});
