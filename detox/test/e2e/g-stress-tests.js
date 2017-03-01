describe('StressTests', () => {
  beforeEach(async () => {
    await device.reloadReactNativeApp();
  });

  beforeEach(async () => {
    await element(by.label('Stress')).tap();
  });

  it('should handle tap during busy bridge (one way)', async () => {
    await element(by.label('Bridge OneWay Stress')).tap();
    await element(by.label('Next')).tap();
    await expect(element(by.label('BridgeOneWay'))).toBeVisible();
  });

  it('should handle tap during busy bridge (two way)', async () => {
    await element(by.label('Bridge TwoWay Stress')).tap();
    await element(by.label('Next')).tap();
    await expect(element(by.label('BridgeTwoWay'))).toBeVisible();
  });

  it('should handle tap during busy bridge (setState)', async () => {
    await element(by.label('Bridge setState Stress')).tap();
    await element(by.label('Next')).tap();
    await expect(element(by.label('BridgeSetState'))).toBeVisible();
  });

  it('should handle tap during busy JS event loop', async () => {
    await element(by.label('EventLoop Stress')).tap();
    await element(by.label('Next')).tap();
    await expect(element(by.label('EventLoop'))).toBeVisible();
  });

  it('should handle consecutive taps', async () => {
    const TAP_COUNT = 20;
    for (let i = 1; i <= TAP_COUNT; i++) {
      await element(by.label('Consecutive Stress ' + i)).tap();
    }
  });
});
