describe('Example', function () {

  beforeEach(function (done) {
    simulator.relaunchApp(done);
  });

  it('should have welcome screen', function () {
    expect(await element(by.text('Welcome'))).toBeVisible();
    expect(await element(by.text('Say Hello'))).toBeVisible();
    expect(await element(by.text('Say World'))).toBeVisible();
  });

  it('should show hello screen after tap', function () {
    element(by.text('Say Hello')).tap();
    expect(await element(by.text('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', function () {
    element(by.text('Say World')).tap();
    expect(await element(by.text('World!!!'))).toBeVisible();
  });

});
