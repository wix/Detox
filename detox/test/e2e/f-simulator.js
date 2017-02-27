describe('Simulator', () => {

  it('reloadReactNativeApp - should tap successfully', async () => {
    await simulator.reloadReactNativeApp();
    await element(by.label('Sanity')).tap();
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('relaunchApp - should tap successfully', async () => {
    await simulator.relaunchApp();
    await element(by.label('Sanity')).tap();
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('relaunchApp({delete: true}) - should tap successfully', async () => {
    await simulator.relaunchApp({delete: true});
    await element(by.label('Sanity')).tap();
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });
});
