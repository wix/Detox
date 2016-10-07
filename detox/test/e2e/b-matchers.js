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

});
