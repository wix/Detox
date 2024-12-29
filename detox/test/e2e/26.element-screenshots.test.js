const {expectElementSnapshotToMatch} = require("./utils/snapshot");

describe('Element screenshots', () => {
  let fancyElement;

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Element-Screenshots')).tap();
    fancyElement = element(by.id('fancyElement'));
  });

  it('should take a screenshot of a vertically-clipped element', async () => {
    await expectElementSnapshotToMatch(fancyElement, 'elementScreenshot.vert');
  });

  it('should take a screenshot of a horizontally-clipped element', async () => {
    await element(by.id('switchOrientation')).tap();
    await expectElementSnapshotToMatch(fancyElement, 'elementScreenshot.horiz', 0.995);
  });
});
