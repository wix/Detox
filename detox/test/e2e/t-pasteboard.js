describe(':ios: Pasteboard', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    await element(by.text('Pasteboard')).tap();
  });

  it('should have stringTextInput', async () => {
    await element(by.id('stringValueInput')).typeText('exampleString\n');
    await element(by.id('CheckButton')).tap();
    await expect(await device.pasteboard()).toHaveString('exampleString');
  });

  it('should have imageValue', async () => {
    await element(by.id('testImageValue')).tap()
    await element(by.id('CheckButton')).tap()
    await expect(await device.pasteboard()).toHaveImage();
  });

  it('should have urlValue', async () => {
    await element(by.id('testURLValue')).tap();
    await element(by.id('testURLValue')).typeText('https://www.wix.com\n');
    await element(by.id('CheckButton')).tap();
    await expect(await device.pasteboard()).toHaveURL('https://www.wix.com');
  });

  it('should have color', async () => {
    await element(by.id('testColorValue')).tap();
    await element(by.id('CheckButton')).tap();
    await expect(await device.pasteboard()).toHaveColor();
  });
});