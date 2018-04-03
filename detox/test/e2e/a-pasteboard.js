describe('Sanity', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    await element(by.text('Pasteboard')).tap();
  });

  it('should have stringTextInput', async () => {
    await expect(element(by.id('stringValueInput'))).toBeVisible();
    await element(by.id('stringValueInput')).typeText('exampleString');
    await element(by.id('stringValueInput')).copyTextToPasteboard()
  });

});
