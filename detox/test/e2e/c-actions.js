describe('Actions', () => {
  beforeEach(async () => {
    await simulator.reloadReactNativeApp();
  });

  beforeEach(async () => {
    await element(by.label('Actions')).tap();
  });

  it('should tap on an element', async () => {
    await element(by.label('Tap Me')).tap();
    await expect(element(by.label('Tap Working!!!'))).toBeVisible();
  });

  it('should long press on an element', async () => {
    await element(by.label('Tap Me')).longPress();
    await expect(element(by.label('Long Press Working!!!'))).toBeVisible();
  });

  it('should multi tap on an element', async () => {
    await element(by.id('UniqueId819')).multiTap(3);
    await expect(element(by.id('UniqueId819'))).toHaveLabel('Taps: 3');
  });

  // Backspace is supported by using "\b" in the string. Return key is supported with "\n"
  it('should type in an element', async () => {
    await element(by.id('UniqueId937')).tap();
    await element(by.id('UniqueId937')).typeText('passcode');
    await expect(element(by.label('Type Working!!!'))).toBeVisible();
  });

  it('should clear text in an element', async () => {
    await element(by.id('UniqueId005')).tap();
    await element(by.id('UniqueId005')).clearText();
    await expect(element(by.label('Clear Working!!!'))).toBeVisible();
  });

  it('should replace text in an element', async () => {
    await element(by.id('UniqueId006')).tap();
    await element(by.id('UniqueId006')).replaceText('replaced_text');
    await expect(element(by.label('Replace Working!!!'))).toBeVisible();
  });

  // directions: 'up'/'down'/'left'/'right'
  it('should scroll for a small amount in direction', async () => {
    await expect(element(by.label('Text1'))).toBeVisible();
    await expect(element(by.label('Text4'))).toBeNotVisible();
    await element(by.id('ScrollView161')).scroll(100, 'down');
    await expect(element(by.label('Text1'))).toBeNotVisible();
    await expect(element(by.label('Text4'))).toBeVisible();
    await element(by.id('ScrollView161')).scroll(100, 'up');
    await expect(element(by.label('Text1'))).toBeVisible();
    await expect(element(by.label('Text4'))).toBeNotVisible();
  });

  it('should scroll for a large amount in direction', async () => {
    await expect(element(by.label('Text6'))).toBeNotVisible();
    await element(by.id('ScrollView161')).scroll(200, 'down');
    await expect(element(by.label('Text6'))).toBeVisible();
  });

  // edges: 'top'/'bottom'/'left'/'right'
  it('should scroll to edge', async () => {
    await expect(element(by.label('Text8'))).toBeNotVisible();
    await element(by.id('ScrollView161')).scrollTo('bottom');
    await expect(element(by.label('Text8'))).toBeVisible();
    await element(by.id('ScrollView161')).scrollTo('top');
    await expect(element(by.label('Text1'))).toBeVisible();
  });

  // TODO - swipe is not good enough for triggering pull to refresh. need to come up with something better
  // directions: 'up'/'down'/'left'/'right', speed: 'fast'/'slow'
  xit('should swipe down until pull to reload is triggered', async () => {
    await element(by.id('ScrollView799')).swipe('down', 'slow');
    await expect(element(by.label('PullToReload Working!!!'))).toBeVisible();
  });

  it('should wait for long timeout', async () => {
    await element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames')).tap();
    await expect(element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames'))).toBeVisible();
  });

});
