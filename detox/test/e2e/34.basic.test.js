
describe('Basic', () => {
  beforeEach(async () => {
    
  });

  it('Basic launch action', async () => {
    await device.launchXCTestApp("com.wix.alon.FirstApp");
    await device.switchTargetApp("bundle.id.try");
  });

  // it('Basic tap action', async () => {
  //   await device.launchXCTestApp("com.wix.alon.FirstApp");
  //   await element(by.id('Sanity')).tap();
  // });

});
