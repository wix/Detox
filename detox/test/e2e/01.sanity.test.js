describe('Sanity', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await detox.traceCall('Navigate to sanity', element(by.text('Sanity')).tap());
  });

  it('should have welcome screen', async () => {
    await expect(element(by.text('ברוכים הבאים!'))).toBeVisible();
    await expect(element(by.text('Say Hello'))).toBeVisible();
    await expect(element(by.text('قل مرحبا!'))).toBeVisible();
  });

  it('should show hello screen after tap', async () => {
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('should show marhaba screen after tap', async () => {
    await element(by.text('قل مرحبا!')).tap();
    await expect(element(by.text('مرحبا!!!'))).toBeVisible();
  });
});
