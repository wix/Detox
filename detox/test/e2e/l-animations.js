describe.only('Animations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.label('Animations')).tap();
  });

  it('should find element', async () => {
    await expect(element(by.id('UniqueId_AnimationsScreen_testedText'))).toBeVisible();
  });
  
});