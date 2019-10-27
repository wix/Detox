let _ = require('lodash');

describe('Animations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Animations')).tap();
  });

  async function _startTest(driver, options = {}) {
    let driverControlSegment = element(by.text(driver).withAncestor(by.id('UniqueId_AnimationsScreen_useNativeDriver')));
    await driverControlSegment.tap();

    if(options.loops !== undefined) {
      let loopSwitch = element(by.id('UniqueId_AnimationsScreen_enableLoop'));
      await loopSwitch.tap();
//TODO: Uncomment this. It seems on iOS 13, EG doesn't catch the switch animation properly. Will uncomment once DTXSync is integrated.
//      if (device.getPlatform() === 'ios') {
//        await expect(loopSwitch).toHaveValue('1');
//      }
      await element(by.id('UniqueId_AnimationsScreen_numberOfIterations')).replaceText(String(options.loops));
    }

    if(options.duration !== undefined) {
      await element(by.id('UniqueId_AnimationsScreen_duration')).replaceText(String(options.duration));
    }

    if(options.delay !== undefined) {
      await element(by.id('UniqueId_AnimationsScreen_delay')).replaceText(String(options.delay));
    }

    await element(by.id('UniqueId_AnimationsScreen_startButton')).tap();
  }

  _.forEach(['JS', 'Native'], (driver) => {
    it(`should find element (driver: ${driver})`, async () => {
      await _startTest(driver);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it(`should detect loops with final number of iterations (driver: ${driver})`, async () => {
      await _startTest(driver, {loops: 4});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it.skip(`should not wait for infinite animations (driver: ${driver})`, async() => {
      await _startTest(driver, {loops: -1});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it(`should not wait during delays longer than 1.5s (driver: ${driver})`, async () => {
      await _startTest(driver, {delay: 1600});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toNotExist();
    });

    it(`should wait during delays shorter than 1.5s (driver: ${driver})`, async () => {
      await _startTest(driver, {delay: 500});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toExist();
    });

  });
});
