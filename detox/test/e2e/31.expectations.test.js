describe('Expectations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Expectations')).tap();
  });

  it(':ios: should expect text fields to be focused after tap but not before', async () => {
    await element(by.label('Text Fields')).tap();
    await expect(element(by.id('TextField_Id1'))).toBeVisible();
    await expect(element(by.id('TextField_Id1'))).toBeNotFocused();
    await expect(element(by.id('TextField_Id1'))).toBeFocused();
  });
});
