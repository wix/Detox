const custom = require('./utils/custom-it');

describe('Actions', () => {
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

  it('should multi tap on an element', async () => {
    await element(by.id('UniqueId819')).multiTap(3);
    await expect(element(by.id('UniqueId819'))).toHaveText('Taps: 3');
  });

  it('should tap on an element at point', async () => {
    await element(by.id('View7990')).tapAtPoint({ x: 180, y: 160 });
    await expect(element(by.id('UniqueId819'))).toHaveText('Taps: 1');
  });

  it('should type in an element', async () => {
    const typedText = device.getPlatform() === 'ios' ? 'Type Working 123 אֱבּג абв!!!' : "Type Working!!!";
    await element(by.id('UniqueId937')).typeText(typedText);
    await expect(element(by.text(typedText))).toBeVisible();
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
    if(device.getPlatform() === 'ios') {
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

  // directions: 'up'/'down'/'left'/'right'
  custom.it.withFailureIf.android.rn58OrNewer('should scroll for a small amount in direction', async () => {
    await expect(element(by.text('Text1'))).toBeVisible();
    await expect(element(by.text('Text4'))).toBeNotVisible();
    await expect(element(by.id('ScrollView161'))).toBeVisible();
    await element(by.id('ScrollView161')).scroll(100, 'down');
    await expect(element(by.text('Text1'))).toBeNotVisible();
    await expect(element(by.text('Text4'))).toBeVisible();
    await element(by.id('ScrollView161')).scroll(100, 'up');
    await expect(element(by.text('Text1'))).toBeVisible();
    await expect(element(by.text('Text4'))).toBeNotVisible();
  });

  custom.it.withFailureIf.android.rn58OrNewer('should scroll for a large amount in direction', async () => {
    await expect(element(by.text('Text6'))).toBeNotVisible();
    await element(by.id('ScrollView161')).scroll(220, 'down');
    await expect(element(by.text('Text6'))).toBeVisible();
  });

  // edges: 'top'/'bottom'/'left'/'right'
  it('should scroll to edge', async () => {
    await expect(element(by.text('Text8'))).toBeNotVisible();
    await element(by.id('ScrollView161')).scrollTo('bottom');
    await expect(element(by.text('Text8'))).toBeVisible();
    await element(by.id('ScrollView161')).scrollTo('top');
    await expect(element(by.text('Text1'))).toBeVisible();
  });

  // TODO - swipe is not good enough for triggering pull to refresh. need to come up with something better
  // directions: 'up'/'down'/'left'/'right', speed: 'fast'/'slow'
  xit('should swipe down until pull to reload is triggered', async () => {
    await element(by.id('ScrollView799')).swipe('down', 'slow');
    await expect(element(by.text('PullToReload Working!!!'))).toBeVisible();
  });

  it('should not wait for long timeout (>1.5s)', async () => {
    await element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames')).tap();
    await expect(element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames'))).toBeVisible();
  });

  it(':ios: should zoom in and out the pinchable scrollview', async () => {
    await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
    await expect(element(by.id('UniqueId007'))).toBeNotVisible();
    await element(by.id('PinchableScrollView')).pinchWithAngle('inward', 'slow', 0);
    await expect(element(by.id('UniqueId007'))).toBeVisible();
  });

});
