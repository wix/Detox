describe('Actions', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('Actions')).tap();
  });

  it('should tap on an element', function () {
    element(by.label('Tap Me')).tap();
    expect(element(by.label('Tap Working!!!'))).toBeVisible();
  });

  it('should long press on an element', function () {
    element(by.label('Tap Me')).longPress();
    expect(element(by.label('Long Press Working!!!'))).toBeVisible();
  });

  it('should multi tap on an element', function () {
    element(by.id('UniqueId819')).multiTap(3);
    expect(element(by.id('UniqueId819'))).toHaveLabel('Taps: 3');
  });

  // Backspace is supported by using "\b" in the string. Return key is supported with "\n"
  it('should type in an element', function () {
    element(by.id('UniqueId937')).typeText('passcode');
    expect(element(by.label('Type Working!!!'))).toBeVisible();
  });

  it('should clear text in an element', function () {
    element(by.id('UniqueId005')).clearText();
    expect(element(by.label('Clear Working!!!'))).toBeVisible();
  });

});
