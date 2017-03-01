describe('Simulator', () => {
  it('reloadReactNativeApp - should tap successfully', async () => {
    await device.reloadReactNativeApp();
    await element(by.label('Sanity')).tap();
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('relaunchApp - should tap successfully', async () => {
    await device.relaunchApp();
    await element(by.label('Sanity')).tap();
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('relaunchApp({delete: true}) - should tap successfully', async () => {
    await device.relaunchApp({delete: true});
    await element(by.label('Sanity')).tap();
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });
});
