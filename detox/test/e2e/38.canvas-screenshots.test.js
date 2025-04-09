const { expectElementSnapshotToMatch } = require('./utils/snapshot');

describe('Canvas screenshots', () => {
  let fancyElement;

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Canvas-Screenshots')).tap();
    fancyElement = element(by.id('fancyElement'));
  });

  it('should take a screenshot of a vertically-clipped element', async () => {
    await expectElementSnapshotToMatch(fancyElement, 'canvasScreenshot.vert');
  });

  it('should take a screenshot of a horizontally-clipped element', async () => {
    await element(by.id('switchOrientation')).tap();
    await expectElementSnapshotToMatch(fancyElement, 'canvasScreenshot.horiz', 0.995);
  });
});
