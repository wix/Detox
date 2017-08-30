describe('StressRoot', () => {
  beforeEach(async () => {
    await device.relaunchApp();
  });

  beforeEach(async () => {
    await element(by.label('Switch Root')).tap();
  });

  after(async () => {
    await device.relaunchApp();
  });

  it('should switch root view controller from RN to native', async () => {
    await element(by.label('Switch to a new native root')).tap();
    await expect(element(by.label('this is a new native root'))).toBeVisible();
  });

  it(':ios: should switch root view controller from RN to RN', async () => {
    await element(by.label('Switch to multiple react roots')).tap();
    await expect(element(by.label('Choose a test'))).toBeVisible();
  });
});
