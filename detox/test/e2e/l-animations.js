let _ = require('lodash');

describe.only('Animations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.label('Animations')).tap();
  });

  async function _startTest() {
    await element(by.id('UniqueId_AnimationsScreen_startButton')).tap();
  }

  _.forEach([false, true], (useNativeDriver) => {
    it(`should find element (useNativeDriver: ${useNativeDriver})`, async () => {
      await _startTest();
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

  });  
});