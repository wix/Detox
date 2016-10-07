describe('Assertions', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('Assertions')).tap();
  });

  it('should assert an element is visible', function () {
    expect(element(by.id('UniqueId204'))).toBeVisible();
  });

  // matches specific text elements like UIButton, UILabel, UITextField or UITextView, RCTText
  it('should assert an element has text', function () {
    expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
  });

  // matches by accesibility label, this might not be the specific displayed text but is much more generic
  it('should assert an element has (accesibility) label', function () {
    expect(element(by.id('UniqueId204'))).toHaveLabel('I contain some text');
  });

});
