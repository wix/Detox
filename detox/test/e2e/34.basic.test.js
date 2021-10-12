
describe('Basic', () => {
  beforeEach(async () => {
    
  });

  it('Basic launch action', async () => {
    // await device.launchApp();
    // await device.launchApp({newInstance: true});
    await device.launchXCTestApp("bundle.id.try");
    await device.reloadReactNative();
  });

});
