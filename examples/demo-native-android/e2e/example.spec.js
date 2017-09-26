describe('Example', function () {

  beforeEach(function (done) {
    simulator.relaunchApp(done);
  });

  it('should have welcome screen', function () {
    expect(element(by.text('Welcome'))).toBeVisible();
    expect(element(by.text('Say Hello'))).toBeVisible();
    expect(element(by.text('Say World'))).toBeVisible();
  });

  it('should show hello screen after tap', function () {
    element(by.text('Say Hello')).tap();
    expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', function () {
    element(by.text('Say World')).tap();
    expect(element(by.text('World!!!'))).toBeVisible();
  });

});
