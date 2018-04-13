describe('Pasteboard', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    // await element(by.text('Pasteboard')).tap();
  });

  it('should have stringTextInput', async () => {
    // await expect(element(by.id('stringValueInput'))).toBeVisible();
    // await element(by.id('stringValueInput')).typeText('exampleString\n');
    // await element(by.id('CheckButton')).tap()
    await device.pasteboardInfo()
    // await element(by.id('backButton')).tap()
  });

});
