describe('Device Orientation', () => {
  beforeEach(async() => {
    await device.reloadReactNative();
    await element(by.text('Orientation')).tap();
    await expect(element(by.id('currentOrientation'))).toExist();
  });

  it('OrientationLandscape', async () => {
    await device.setOrientation('landscape');

    await expect(element(by.id('currentOrientation'))).toHaveText('Landscape');
  });

  it('OrientationPortrait', async() => {
    // As default is portrait we need to set it otherwise
    await device.setOrientation('landscape');
    await device.setOrientation('portrait');

    await expect(element(by.id('currentOrientation'))).toHaveText('Portrait');
  });
});
