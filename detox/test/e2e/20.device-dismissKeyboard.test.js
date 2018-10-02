describe('Device DismissKeyboard', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('Dismiss Keyboard')).tap();
    await expect(element(by.id('currentKeyboardVisibility'))).toExist();
  });

  it(':ios: should dismiss keyboard', async () => {
    await element(by.id('testInput')).tap();
    await expect(element(by.id('currentKeyboardVisibility'))).toHaveText('KeyboardOpen');
    await device.dismissKeyboard();
    await expect(element(by.id('currentKeyboardVisibility'))).toHaveText('KeyboardClosed');
  });
});
