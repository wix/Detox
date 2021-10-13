
describe('Basic', () => {
  beforeEach(async () => {
    
  });

  it('Basic launch action', async () => {
    await device.launchXCTestApp("com.wix.alon.FirstApp");
  });

  it('Basic tap action', async () => {
    await device.launchXCTestApp("com.wix.alon.FirstApp");
    await element(by.id('btnSomeScreen')).tap();
  });

  it('terminate app', async () => {
    await device.launchXCTestApp("com.wix.alon.FirstApp");
    await device.terminateXCTestApp("com.wix.alon.FirstApp");
    await device.launchXCTestApp("com.wix.alon.TryXCUITestsApp");
    await device.terminateXCTestApp("com.wix.alon.TryXCUITestsApp");
  });

  it('Moving between apps and interact with them', async () => {
    await device.launchXCTestApp("com.wix.alon.FirstApp");
    await element(by.id('btnGoToCoolApp')).tap();
    await device.switchTargetApp("com.wix.alon.TryXCUITestsApp");
    await element(by.id('btnFirstScreen')).tap();
  });
});
