describe('StressRoot', () => {
  beforeEach(async () => {
    await device.relaunchApp();
  });

  beforeEach(async () => {
    await element(by.text('Switch Root')).tap();
  });

  after(async () => {
    await device.relaunchApp();
  });

  it('should switch root view controller from RN to native', async () => {
    await element(by.text('Switch to a new native root')).tap();
    await expect(element(by.text('this is a new native root'))).toBeVisible();
  });

  it(':ios: should switch root view controller from RN to RN', async () => {
    await element(by.text('Switch to multiple react roots')).tap();
    await expect(element(by.text('Choose a test'))).toBeVisible();
  });
});
