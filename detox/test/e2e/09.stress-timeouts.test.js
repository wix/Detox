describe('StressTimeouts', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Timeouts')).tap();
  });

  it('should handle a short timeout', async () => {
    await element(by.id('TimeoutShort')).tap();
    await expect(element(by.text('Short Timeout Working!!!'))).toBeVisible();
  });

  it('should handle zero timeout', async () => {
    await element(by.id('TimeoutZero')).tap();
    await expect(element(by.text('Zero Timeout Working!!!'))).toBeVisible();
  });

  it('should ignore a short timeout', async () => {
    await element(by.id('TimeoutIgnoreShort')).tap();
    await expect(element(by.text('Short Timeout Ignored!!!'))).toBeVisible();
  });

  it('should ignore a long timeout', async () => {
    await element(by.id('TimeoutIgnoreLong')).tap();
    await expect(element(by.text('Long Timeout Ignored!!!'))).toBeVisible();
  });

  it('should handle setImmediate', async () => {
    await element(by.id('Immediate')).tap();
    await expect(element(by.text('Immediate Working!!!'))).toBeVisible();
  });

  it('should ignore setInterval', async () => {
    await element(by.id('IntervalIgnore')).tap();
    await expect(element(by.text('Interval Ignored!!!'))).toBeVisible();
  });
});
