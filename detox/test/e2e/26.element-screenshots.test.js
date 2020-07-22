const fs = require('fs');

describe(':android: Element screenshots', () => {
  const screenshotAssetPath = './e2e/assets/elementScreenshot-android.png';

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Matchers')).tap();
  });

  it('should take a screenshot of an element', async () => {
    const bitmapPath = await element(by.id('Grandfather883')).takeScreenshot();
    const bitmapBuffer = fs.readFileSync(bitmapPath);
    const expectedBitmapBuffer = fs.readFileSync(screenshotAssetPath);
    if (!bitmapBuffer.equals(expectedBitmapBuffer)) {
      throw new Error([
          `Bitmaps at (1) ${bitmapPath} and (2) ${screenshotAssetPath} are different!`,
          '(1): ' + JSON.stringify(bitmapBuffer),
          'VS.',
          '(2): ' + JSON.stringify(expectedBitmapBuffer),
        ].join('\n'));
      }
  });
});
