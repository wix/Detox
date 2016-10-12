describe('Matchers', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('Matchers')).tap();
  });

  it('should match elements by (accesibility) label', function () {
    element(by.label('Label')).tap();
    expect(element(by.label('Label Working!!!'))).toBeVisible();
  });

  it('should match elements by (accesibility) id', function () {
    element(by.id('UniqueId345')).tap();
    expect(element(by.label('ID Working!!!'))).toBeVisible();
  });

  it('should match elements by type (native class)', function () {
    expect(element(by.type('RCTImageView'))).toBeVisible();
    element(by.type('RCTImageView')).tap();
    expect(element(by.type('RCTImageView'))).toBeNotVisible();
  });

  // https://facebook.github.io/react-native/docs/accessibility.html#accessibilitytraits-ios
  // Accessibility Inspector in the simulator can help investigate traits
  it('should match elements by accesibility trait', function () {
    element(by.traits(['button', 'text'])).tap();
    expect(element(by.label('Traits Working!!!'))).toBeVisible();
  });

  it('should match elements with ancenstor (parent)', function () {
    expect(element(by.id('Grandson883').withAncestor(by.id('Son883')))).toExist();
    expect(element(by.id('Son883').withAncestor(by.id('Grandson883')))).toNotExist();
    expect(element(by.id('Grandson883').withAncestor(by.id('Father883')))).toExist();
    expect(element(by.id('Father883').withAncestor(by.id('Grandson883')))).toNotExist();
    expect(element(by.id('Grandson883').withAncestor(by.id('Grandfather883')))).toExist();
    expect(element(by.id('Grandfather883').withAncestor(by.id('Grandson883')))).toNotExist();
  });

  it('should match elements with descendant (child)', function () {
    expect(element(by.id('Son883').withDescendant(by.id('Grandson883')))).toExist();
    expect(element(by.id('Grandson883').withDescendant(by.id('Son883')))).toNotExist();
    expect(element(by.id('Father883').withDescendant(by.id('Grandson883')))).toExist();
    expect(element(by.id('Grandson883').withDescendant(by.id('Father883')))).toNotExist();
    expect(element(by.id('Grandfather883').withDescendant(by.id('Grandson883')))).toExist();
    expect(element(by.id('Grandson883').withDescendant(by.id('Grandfather883')))).toNotExist();
  });

  it('should match elements by using two matchers together with and', function () {
    expect(element(by.id('UniqueId345').and(by.label('ID')))).toExist();
    expect(element(by.id('UniqueId345').and(by.label('RandomJunk')))).toNotExist();
  });

  // waiting to upgrade EarlGrey version in order to test this (not supported in our current one)
  it.skip('should choose from multiple elements matching the same matcher using index', function () {
    expect(element(by.label('Product')).atIndex(2)).toHaveId('ProductId002');
  });

});
