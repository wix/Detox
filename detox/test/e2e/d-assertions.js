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

});
