describe('Example', () => {
  beforeEach(async () => {
    await device.relaunchApp();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.label('Welcome'))).toBeVisible();
    await expect(element(by.label('Say Hello'))).toBeVisible();
    await expect(element(by.label('Say World'))).toBeVisible();
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
