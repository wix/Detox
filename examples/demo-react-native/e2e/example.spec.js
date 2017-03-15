describe('Example', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.label('Welcome'))).toBeVisible();
  });

  it('should show hello screen after tap', async () => {
    await element(by.label('Say Hello')).tap();
    await expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', async () => {
    await element(by.label('Say World')).tap();
    await expect(element(by.label('World!!!'))).toBeVisible();
  });
});
