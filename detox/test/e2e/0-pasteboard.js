describe('Pasteboard', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    await element(by.text('Pasteboard')).tap();
  });

  it('should have stringTextInput', async () => {
    await element(by.id('stringValueInput')).typeText('exampleString\n');
    await element(by.id('CheckButton')).tap();
    await expect(device).pasteboardToHaveString('exampleString');
    await element(by.id('backButton')).tap();
  });

  it('should have imageValue', async () => {
    await element(by.id('testImageValue')).tap()
    await element(by.id('CheckButton')).tap()
    await expect(device).pasteboardToHaveImage();
    await element(by.id('backButton')).tap()
  });

  it('should have urlValue', async () => {
    await element(by.id('testURLValue')).tap();
    await element(by.id('testURLValue')).typeText('exampleURL\n');
    await element(by.id('CheckButton')).tap();
    await expect(device).pasteboardToHaveURL('exampleURL');
    await element(by.id('backButton')).tap();
  });

  it('should have color', async () => {
    await element(by.id('testColorValue')).tap();
    await element(by.id('CheckButton')).tap();
    await expect(device).pasteboardToHaveColor();
    await element(by.id('backButton')).tap();
  });

  

});
