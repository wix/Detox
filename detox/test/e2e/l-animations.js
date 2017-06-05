let _ = require('lodash');

describe.only('Animations', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.label('Animations')).tap();
  });

  async function _startTest(driver, loops, duration, delay) {
    async function typeTextToInput(inputId, text) {
      let input = await element(by.id(inputId));
      await expect(input).toExist();
      await input.tap();
      await input.typeText(String(text) + '\n');
    }

    let driverControlMatcher = by.id('UniqueId_AnimationsScreen_useNativeDriver');
    let driverControlElement = await element(driverControlMatcher);
    let driverControlSegment = await element(by.text(driver).withAncestor(driverControlMatcher));
    await expect(driverControlSegment).toExist();
    await driverControlSegment.tap();
    // await expect(driverControlElement).toHaveValue(driver === 'JS' ? '0' : '1');

    if(loops !== undefined) {
      let loopSwitch = await element(by.id('UniqueId_AnimationsScreen_enableLoop'));
      await expect(loopSwitch).toExist();
      await loopSwitch.tap();
      await expect(loopSwitch).toHaveValue('1');

      await typeTextToInput('UniqueId_AnimationsScreen_numberOfIterations', loops);
    }

    if(duration !== undefined) {
      await typeTextToInput('UniqueId_AnimationsScreen_duration', duration);
    }

    if(delay !== undefined) {
      await typeTextToInput('UniqueId_AnimationsScreen_delay', delay);
    }

    let startButton = await element(by.id('UniqueId_AnimationsScreen_startButton'));
    await expect(startButton).toExist();
    await startButton.tap();
  }

  _.forEach(['JS', 'Native'], (driver) => {
    it(`should find element (driver: ${driver})`, async () => {
      await _startTest(driver);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it(`should detect loops with final number of iterations (driver: ${driver})`, async () => {
      await _startTest(driver, 4);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it.skip(`should not wait for infinite animations (driver: ${driver})`, async() => {
      await _startTest(driver, -1);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toBeVisible();
    });

    it(`should not wait during delays longer than 1.5s (driver: ${driver})`, async () => {
      await _startTest(driver, undefined, 400, 3000);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toNotExist();
    });
    
    it(`should wait during delays shorter than 1.5s (driver: ${driver})`, async () => {
      await _startTest(driver, undefined, 400, 500);
      await expect(element(by.id('UniqueId_AnimationsScreen_afterAnimationText'))).toExist();
    });
    
  });  
});