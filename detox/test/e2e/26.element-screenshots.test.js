const {expectElementSnapshotToMatch} = require('./utils/snapshot');

describe('Element screenshots', () => {
  let androidSdk;
  let fancyElement;

  beforeAll(async () => {
    if (device.getPlatform() === 'android') {
      const adbName = device.id;
      const { adb } = device.deviceDriver;

      androidSdk = await adb.apiLevel(adbName);
      if (!androidSdk) {
        console.warn('Could not determine Android SDK version - test results may be futile.');
      }
    }
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('main-menu-scroll')).scrollTo('bottom');
    await element(by.text('Element-Screenshots')).tap();
    fancyElement = element(by.id('fancyElement'));
  });

  it('should take a screenshot of a vertically-clipped element', async () => {
    await expectElementSnapshotToMatch(fancyElement, 'elementScreenshot.vert', undefined, androidSdk);
  });

  it('should take a screenshot of a horizontally-clipped element', async () => {
    await element(by.id('switchOrientation')).tap();
    await expectElementSnapshotToMatch(fancyElement, 'elementScreenshot.horiz', 0.995, androidSdk);
  });
});
