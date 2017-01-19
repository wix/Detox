describe('Actions', () => {
  beforeEach((done) => {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(() => {
    element(by.label('Actions')).tap();
  });

  it('should tap on an element', () => {
    element(by.label('Tap Me')).tap();
    expect(element(by.label('Tap Working!!!'))).toBeVisible();
  });

  it('should long press on an element', () => {
    element(by.label('Tap Me')).longPress();
    expect(element(by.label('Long Press Working!!!'))).toBeVisible();
  });

  it('should multi tap on an element', () => {
    element(by.id('UniqueId819')).multiTap(3);
    expect(element(by.id('UniqueId819'))).toHaveLabel('Taps: 3');
  });

  // Backspace is supported by using "\b" in the string. Return key is supported with "\n"
  it('should type in an element', () => {
    element(by.id('UniqueId937')).tap();
    element(by.id('UniqueId937')).typeText('passcode');
    expect(element(by.label('Type Working!!!'))).toBeVisible();
  });

  it('should clear text in an element', () => {
    element(by.id('UniqueId005')).tap();
    element(by.id('UniqueId005')).clearText();
    expect(element(by.label('Clear Working!!!'))).toBeVisible();
  });

  it('should replace text in an element', () => {
    element(by.id('UniqueId006')).tap();
    element(by.id('UniqueId006')).replaceText('replaced_text');
    expect(element(by.label('Replace Working!!!'))).toBeVisible();
  });

  // directions: 'up'/'down'/'left'/'right'
  it('should scroll for a small amount in direction', () => {
    expect(element(by.label('Text1'))).toBeVisible();
    expect(element(by.label('Text4'))).toBeNotVisible();
    element(by.id('ScrollView161')).scroll(100, 'down');
    expect(element(by.label('Text1'))).toBeNotVisible();
    expect(element(by.label('Text4'))).toBeVisible();
    element(by.id('ScrollView161')).scroll(100, 'up');
    expect(element(by.label('Text1'))).toBeVisible();
    expect(element(by.label('Text4'))).toBeNotVisible();
  });

  it('should scroll for a large amount in direction', () => {
    expect(element(by.label('Text6'))).toBeNotVisible();
    element(by.id('ScrollView161')).scroll(200, 'down');
    expect(element(by.label('Text6'))).toBeVisible();
  });

  // edges: 'top'/'bottom'/'left'/'right'
  it('should scroll to edge', () => {
    expect(element(by.label('Text8'))).toBeNotVisible();
    element(by.id('ScrollView161')).scrollTo('bottom');
    expect(element(by.label('Text8'))).toBeVisible();
    element(by.id('ScrollView161')).scrollTo('top');
    expect(element(by.label('Text1'))).toBeVisible();
  });

  // TODO - swipe is not good enough for triggering pull to refresh. need to come up with something better
  // directions: 'up'/'down'/'left'/'right', speed: 'fast'/'slow'
  xit('should swipe down until pull to reload is triggered', () => {
    element(by.id('ScrollView799')).swipe('down', 'slow');
    expect(element(by.label('PullToReload Working!!!'))).toBeVisible();
  });

  it('should wait for long timeout', () => {
    element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames')).tap();
    expect(element(by.id('WhyDoAllTheTestIDsHaveTheseStrangeNames'))).toBeVisible();
  });

});
