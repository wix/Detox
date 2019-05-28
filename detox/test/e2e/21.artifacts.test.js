describe('Artifacts', () => {
  before(async () => {
    await device.sendToHome();
    await device.takeScreenshot('Artifacts/before all');
    await device.launchApp({newInstance: true});
  });

  beforeEach(async () => {
    // implicitly taking screenshot - beforeEach.png
    await device.reloadReactNative();
    await device.takeScreenshot('in main menu');

    await element(by.text('Actions')).tap();
    await device.takeScreenshot('Actions');
  });

  it('should take screenshots inside test', async () => {
    await element(by.id('UniqueId819')).tap();
    await device.takeScreenshot('taps - 1');

    await element(by.id('UniqueId819')).tap();
    await device.takeScreenshot('taps - 2');
  });

  afterEach(async () => {
    await element(by.text('Tap Me')).tap();
    await device.takeScreenshot('tap working');

    await device.reloadReactNative();
    // implicitly taking screenshot - afterEach.png
  });

  after(async () => {
    await device.sendToHome();
    await device.takeScreenshot('Artifacts/after all');
    await device.launchApp();
  });
});
