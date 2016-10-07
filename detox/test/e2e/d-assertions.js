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

  it('should assert an element is not visible', function () {
    expect(element(by.id('UniqueId205'))).toBeNotVisible();
  });

  // prefer toBeVisible to make sure the user actually sees this element
  it('should assert an element exists', function () {
    expect(element(by.id('UniqueId205'))).toExist();
  });

  it('should assert an element does not exist', function () {
    expect(element(by.id('RandomJunk959'))).toNotExist();
  });

  // matches specific text elements like UIButton, UILabel, UITextField or UITextView, RCTText
  it('should assert an element has text', function () {
    expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
  });

  // matches by accesibility label, this might not be the specific displayed text but is much more generic
  it('should assert an element has (accesibility) label', function () {
    expect(element(by.id('UniqueId204'))).toHaveLabel('I contain some text');
  });

  it('should assert an element has (accesibility) id', function () {
    expect(element(by.label('I contain some text'))).toHaveId('UniqueId204');
  });

});
