const { isRNNewArch } = require('../../src/utils/rn-consts/rn-consts');
const driver = require('./drivers/actions-driver').actionsScreenDriver;

describe('Actions', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.text('Actions')).tap();
  });

  it('should tap on an element', async () => {
    await element(by.text('Tap Me')).tap();
    await expect(element(by.text('Tap Working!!!'))).toBeVisible();
  });

  it('should long press on an element', async () => {
    await element(by.text('Tap Me')).longPress();
    await expect(element(by.text('Long Press Working!!!'))).toBeVisible();
  });

  it('should long press with duration on an element', async () => {
    await element(by.text('Long Press Me 1.5s')).longPress(1500);
    await expect(element(by.text('Long Press With Duration Working!!!'))).toBeVisible();
  });

  it('should long press with point', async () => {
    await element(by.text('Long Press on Top Left')).longPress({ x: 5, y: 5 });
    await expect(element(by.text('Long Press on Top Left Working!!!'))).toBeVisible();
  });

  it('should not succeed in long pressing with point outside the target area', async () => {
    await element(by.text('Long Press on Top Left')).longPress({ x: 15, y: 15 });
    await expect(element(by.text('Long Press on Top Left Working!!!'))).not.toBeVisible();
  });

  it(':android: should tap on an element at point', async () => {
    await driver.tapsElement.tapAtPoint();
    await driver.tapsElement.assertTappedOnce();
  });

  it.each([
    'activate',
    'magicTap',
    'escape',
    'increment',
    'decrement',
    'longpress',
    'custom',
  ])('should perform %s accessibilityAction', async (actionName) => {
    await element(by.id('View7991')).performAccessibilityAction(actionName);
    await expect(
      element(by.text(`Accessibility Action ${actionName} Working!!!`)),
    ).toBeVisible();
  });

  describe('multi-tapping', () => {
    it('should multi tap on an element', async () => {
      await driver.tapsElement.multiTap();
      await driver.tapsElement.assertMultiTapped();
    });

    it(':android: should properly double-tap on an element', async () => {
      await driver.doubleTapsElement.doubleTap();
      await driver.doubleTapsElement.assertTapsCount(1);

      await driver.doubleTapsElement.doubleTap();
      await driver.doubleTapsElement.assertTapsCount(2);

      await driver.doubleTapsElement.doubleTap();
      await driver.doubleTapsElement.assertTapsCount(3);
    });

    it(':android: should fail to apply 2 distinct taps on a double-tap element', async () => {
      await driver.doubleTapsElement.tapTwice();
      await driver.doubleTapsElement.assertNoTaps();

      await driver.doubleTapsElement.tapTwice();
      await driver.doubleTapsElement.assertNoTaps();

      await driver.doubleTapsElement.tapTwice();
      await driver.doubleTapsElement.assertNoTaps();
    });

    it(':android: should fail to register a tap following a multi-tap as a double-tap', async () => {
      await driver.doubleTapsElement.multiTapOnce();
      await driver.doubleTapsElement.tapOnce();
      await driver.doubleTapsElement.assertNoTaps();
    });

    it(':android: should fail to apply 2 distinct taps on a double-tap element at explicit point', async () => {
      await driver.doubleTapsElement.tapAtPointTwice();
      await driver.doubleTapsElement.assertNoTaps();
    });
  });

  it.skip(':android: should throw if tap handling is too slow', async () => {
    try {
      await driver.sluggishTapElement.tap();
    } catch (e) {
      console.log('Got an expected error', e);
      if (!e.toString().includes('Tap handled too slowly, and turned into a long-tap!')) {
        throw new Error('Error content isn\'t as expected!');
      }
      return;
    }

    throw new Error('Expected an error');
  });

  it('should type in an element', async () => {
    const typedText = device.getPlatform() === 'ios' ? 'Type Working 123 אֱבּג абв!!!' : "Type Working!!!";
    await element(by.id('UniqueId937')).typeText(typedText);
    await expect(element(by.text(typedText))).toBeVisible();
  });

  it(':ios: should type in a wrapped element', async () => {
    const typedText = device.getPlatform() === 'ios' ? 'Type Working 123 אֱבּג абв!!!' : "Type Working!!!";
    await element(by.id('UniqueId937_wrapper')).typeText(typedText);
    await expect(element(by.text(typedText))).toBeVisible();
  });

  it(':ios: should fail typing in a view without text element', async () => {
    const typedText = 'Won\'t be typed at all';
    let failed = false;
    try {
      await element(by.id('NoTextInputInside')).typeText(typedText);
    } catch (ex) {
      failed = true;
    }

    if (failed === false) {
      throw new Error('Test should have thrown an error, but did not');
    }
  });

  it('should press the backspace key on an element', async () => {
    const typedText = 'test';
    await element(by.id('UniqueId937')).typeText(typedText + 'x');
    await element(by.id('UniqueId937')).tapBackspaceKey();
    await expect(element(by.text(typedText))).toBeVisible();
  });

  it('should press the return key on an element', async () => {
    await element(by.id('UniqueId937')).tapReturnKey();
    await expect(element(by.text('Return Working!!!'))).toBeVisible();
  });

  it('should clear text in an element', async () => {
    if (device.getPlatform() === 'ios') {
      //Add a complex string on iOS to ensure clear works as expected.
      const typedText = 'Clear this אֱבּג';
      await element(by.id('UniqueId005')).replaceText(typedText);
    }
    await element(by.id('UniqueId005')).clearText();
    await expect(element(by.text('Clear Working!!!'))).toBeVisible();
  });

  it('should replace text in an element', async () => {
    await element(by.id('UniqueId006')).replaceText('replaced_text');
    await expect(element(by.text('Replace Working!!!'))).toBeVisible();
  });


  it('should swipe down until pull to reload is triggered', async () => {
    await element(by.id('ScrollView799')).swipe('down', 'fast');
    await expect(element(by.text('PullToReload Working!!!'))).toBeVisible();
  });

  it('should swipe vertically', async () => {
    await expect(element(by.text('Text1'))).toBeVisible();
    await element(by.id('ScrollView161')).swipe('up');

    if (device.getPlatform() === 'ios') {
      // This won't work in Android, see related issue: https://github.com/facebook/react-native/issues/23870
      await expect(element(by.text('Text1'))).not.toBeVisible();
    }

    await element(by.id('ScrollView161')).swipe('down');
    await expect(element(by.text('Text1'))).toBeVisible();
  });

  it('should swipe horizontally', async () => {
    await expect(element(by.text('HText1'))).toBeVisible();

    await element(by.id('ScrollViewH')).swipe('left');
    await expect(element(by.text('HText1'))).not.toBeVisible();

    await element(by.id('ScrollViewH')).swipe('right');
    await expect(element(by.text('HText1'))).toBeVisible();
  });

  it('should swipe vertically by offset from specified positions', async () => {
    await element(by.id('toggleScrollOverlays')).tap();

    await element(by.id('ScrollView161')).swipe('up', 'slow', NaN, 0.9, 0.95);
    if (device.getPlatform() === 'ios') {
      // This won't work in Android, see related issue: https://github.com/facebook/react-native/issues/23870
      await expect(element(by.text('Text1'))).not.toBeVisible(1);
    }

    await element(by.id('ScrollView161')).swipe('down', 'fast', NaN, 0.1, 0.05);
    await expect(element(by.text('Text1'))).toBeVisible(1);
  });

  it('should swipe horizontally by offset from specified positions ', async () => {
    await element(by.id('toggleScrollOverlays')).tap();

    await element(by.id('ScrollViewH')).swipe('left', 'slow', 0.28, 0.85, 0.75);
    await expect(element(by.text('HText1'))).not.toBeVisible(1);

    await element(by.id('ScrollViewH')).swipe('right', 'fast', 0.28, 0.15, 0.25);
    await expect(element(by.text('HText1'))).toBeVisible(1);
  });

  it('should not wait for long timeout (>1.5s)', async () => {
    await element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames')).tap();
    await expect(element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames'))).toBeVisible();
  });

  it(':ios: should zoom in and out the pinchable scrollview', async () => {
    await element(by.id('PinchableScrollView')).pinch(1.5);
    await expect(element(by.id('UniqueId007'))).not.toBeVisible();
    await element(by.id('PinchableScrollView')).pinch(0.75, 'slow');
    await expect(element(by.id('UniqueId007'))).toBeVisible();
  });

  it('should adjust slider and assert its value', async () => {
    const reactSliderId = 'sliderWithASimpleID';
    await expect(element(by.id(reactSliderId))).toHaveSliderPosition(0.25);
    await element(by.id(reactSliderId)).adjustSliderToPosition(0.75);
    await expect(element(by.id(reactSliderId))).not.toHaveSliderPosition(0.74);
    await expect(element(by.id(reactSliderId))).toHaveSliderPosition(0.74, 0.1);

    // On iOS + legacy arch the accessibilityValue is set to the slider value, but not on android
    if (device.getPlatform() === 'ios' && !isRNNewArch) {
      await expect(element(by.id(reactSliderId))).toHaveValue('75%');
    }
  });

  it('should expect text fields to be focused after tap but not before', async () => {
    const textField1 = element(by.id('UniqueId005'));
    const textField2 = element(by.id('UniqueId006'));

    await expect(textField1).toBeNotFocused();
    await expect(textField2).toBeNotFocused();
    await expect(textField1).not.toBeFocused();
    await expect(textField2).not.toBeFocused();

    await textField1.tap();
    await expect(textField1).toBeFocused();
    await expect(textField2).toBeNotFocused();
    await expect(textField2).not.toBeFocused();

    await textField2.tap();
    await expect(textField1).toBeNotFocused();
    await expect(textField1).not.toBeFocused();
    await expect(textField2).toBeFocused();
  });

  describe('pending interactions', () => {
    const multipleInteractionsWarning = 'Detox has detected multiple interactions taking place simultaneously. ' +
      'Have you forgotten to apply an await over one of the Detox actions in your test code?';

    it('should throw an exception when attempting to send an interaction while another is pending', async () => {
      element(by.id('UniqueId937')).typeText('one ')
        .catch(e => {
          if (!e.toString().includes(multipleInteractionsWarning)) {
            throw new Error('Test should have thrown a multiple interactions error, but did not');
          }
        });
      await element(by.id('UniqueId937')).typeText(' two')
        .catch(e => {
          if (!e.toString().includes(multipleInteractionsWarning)) {
            throw new Error('Test should have thrown a multiple interactions error, but did not');
          }
        });
    });
  });
});
