describe('Expectations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Expectations')).tap();
  });

  it('should expect text fields to be focused after tap but not before', async () => {
    await element(by.id('TextFields')).tap();
    await expect(element(by.id('TextField_Id1'))).toBeVisible();
    await expect(element(by.id('TextField_Id1'))).toBeNotFocused();
    await expect(element(by.id('TextField_Id2'))).toBeNotFocused();
    await element(by.id('TextField_Id1')).tap();
    await expect(element(by.id('TextField_Id1'))).toBeFocused();
    await expect(element(by.id('TextField_Id2'))).toBeNotFocused();
    await element(by.id('TextField_Id2')).tap();
    await expect(element(by.id('TextField_Id2'))).toBeFocused();
    await expect(element(by.id('TextField_Id1'))).toBeNotFocused();
  });
});
