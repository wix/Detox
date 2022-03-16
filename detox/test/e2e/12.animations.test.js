describe('React-Native Animations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('RN Animations')).tap();
  });

  async function _startTest(driver, options = {}) {
    let driverControlSegment = element(by.text(driver).withAncestor(by.id('UniqueId_AnimationsScreen_useNativeDriver')));
    await driverControlSegment.tap();

    if(options.loops !== undefined) {
      let loopSwitch = element(by.id('UniqueId_AnimationsScreen_enableLoop'));
      await loopSwitch.tap();
      if (device.getPlatform() === 'ios') {
        await expect(loopSwitch).toHaveValue('1');
      }
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

  describe.each(['JS', 'Native'])('(driver: %s)', (driver) => {
    it(`should find element`, async () => {
      await _startTest(driver);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it(`should detect loops with final number of iterations`, async () => {
      await _startTest(driver, {loops: 4});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it.skip(`should not wait for infinite animations`, async() => {
      await _startTest(driver, {loops: -1});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it(`should not wait during delays longer than 1.5s`, async () => {
      await _startTest(driver, {delay: 1600});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).not.toExist();
    });

    it(`should wait during delays shorter than 1.5s`, async () => {
      await _startTest(driver, {delay: 500});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toExist();
    });

    it(`should not wait for an animation to complete while the synchronization is disabled`, async () => {
      await device.disableSynchronization(); 
      await _startTest(driver, {duration: 5000});
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).not.toExist();

      await device.enableSynchronization();
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toExist();
    });
  });
});

describe(':android: Native animations', () => {
  it('should expect a native android-animator animation to be short-circuited / fully-completed', async () => {
    await device.reloadReactNative();
    await element(by.text('Native Animation')).tap();

    await element(by.id('startButton')).tap();
    await expect(element(by.text('Animation Complete'))).toBeVisible();
  });
});
