describe.only('Actions', function () {

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

});
