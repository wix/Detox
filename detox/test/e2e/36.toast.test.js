describe(':ios: Toast', () => {
  beforeEach(async () => {
    await device.launchApp({newInstance: true});
    await element(by.text('Toast')).tap();

    await expect(element(by.id('toast-button'))).not.toBeVisible();
  });

  it('should be able to tap on toast button (overlay toast)', async () => {
    await element(by.id('toggle-toast-button')).tap();
    await expect(element(by.id('toast-button'))).toBeVisible();

    await element(by.id('toast-button')).tap();
    await element(by.id('toggle-toast-button')).tap();
    await expect(element(by.id('toast-button'))).not.toBeVisible();
  });
});
