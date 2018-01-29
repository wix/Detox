describe('StressTests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Stress')).tap();
  });

  it('should handle tap during busy bridge (one way)', async () => {
    await element(by.text('Bridge OneWay Stress')).tap();
    await element(by.text('Next')).tap();
    await expect(element(by.text('BridgeOneWay'))).toBeVisible();
  });

  it('should handle tap during busy bridge (two way)', async () => {
    await element(by.text('Bridge TwoWay Stress')).tap();
    await element(by.text('Next')).tap();
    await expect(element(by.text('BridgeTwoWay'))).toBeVisible();
  });

  it('should handle tap during busy bridge (setState)', async () => {
    await element(by.text('Bridge setState Stress')).tap();
    await element(by.text('Next')).tap();
    await expect(element(by.text('BridgeSetState'))).toBeVisible();
  });

  it('should handle tap during busy JS event loop', async () => {
    await element(by.text('EventLoop Stress')).tap();
    await element(by.text('Next')).tap();
    await expect(element(by.text('EventLoop'))).toBeVisible();
  });

  it('should handle consecutive taps', async () => {
    const TAP_COUNT = 20;
    for (let i = 1; i <= TAP_COUNT; i++) {
      await element(by.text('Consecutive Stress ' + i)).tap();
    }
  });
});
