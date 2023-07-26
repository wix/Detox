describe(':ios: Custom Keyboard', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Custom Keyboard')).tap();
  });
  
  afterEach(async () => {
    await element(by.id('closeButton')).tap();
  });

  it('should interact with keyboard when field is first responder', async () => {
    await element(by.id('textWithCustomInput')).tap();
    await element(by.id('keyboardHelloButton')).tap();
    await expect(element(by.id('textWithCustomInput'))).toHaveText('World!');
  });

  it('should obscure elements at bottom of screen when visible', async () => {
    await expect(element(by.text('Obscured by keyboard'))).toBeVisible();
    await element(by.id('textWithCustomInput')).tap();
    await expect(element(by.text('Obscured by keyboard'))).toBeNotVisible();
  });
});
