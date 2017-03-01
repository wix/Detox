describe('Example', function () {

  beforeEach(function (done) {
    simulator.reloadReactNative(done);
  });

  it('should have welcome screen', function () {
    expect(element(by.label('Welcome'))).toBeVisible();
  });

  it('should show hello screen after tap', function () {
    element(by.label('Say Hello')).tap();
    expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', function () {
    element(by.label('Say World')).tap();
    expect(element(by.label('World!!!'))).toBeVisible();
  });

});
