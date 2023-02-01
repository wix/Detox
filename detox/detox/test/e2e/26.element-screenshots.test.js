const fs = require('fs');

describe('Element screenshots', () => {

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Element-Screenshots')).tap();
  });

  it('should take a screenshot of a vertically-clipped element', async () => {
    const screenshotAssetPath = `./e2e/assets/elementScreenshot.${device.getPlatform()}.vert.png`;

    const bitmapPath = await element(by.id('fancyElement')).takeScreenshot();
    expectBitmapsToBeEqual(bitmapPath, screenshotAssetPath);
  });

  it('should take a screenshot of a horizontally-clipped element', async () => {
    const screenshotAssetPath = `./e2e/assets/elementScreenshot.${device.getPlatform()}.horiz.png`;

    await element(by.id('switchOrientation')).tap();

    const bitmapPath = await element(by.id('fancyElement')).takeScreenshot('fancy-element');
    expectBitmapsToBeEqual(bitmapPath, screenshotAssetPath);
  });

  function expectBitmapsToBeEqual(bitmapPath, expectedBitmapPath) {
    const bitmapBuffer = fs.readFileSync(bitmapPath);
    const expectedBitmapBuffer = fs.readFileSync(expectedBitmapPath);
    if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
      throw new Error(`Expected bitmap at ${bitmapPath} to be equal to ${expectedBitmapPath}, but it is different!`);
    }
  }
});
