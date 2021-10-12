
describe('Basic', () => {
  beforeEach(async () => {
    
  });

  it('Basic launch action', async () => {
    await device.launchXCTestApp("bundle.id.try");
  });

  it('Basic tap action', async () => {
    await device.launchXCTestApp("bundle.id.try");
    await element(by.id('Sanity')).tap();
  });

});
