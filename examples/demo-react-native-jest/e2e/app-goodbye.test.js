describe('Example (goodbye)', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show goodbye screen after tap', async () => {
    await element(by.id('goodbye_button')).tap();
    await expect(await element(by.text('Goodbye, World!!!'))).toBeVisible();
  });
});
