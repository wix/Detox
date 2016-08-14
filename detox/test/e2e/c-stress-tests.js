describe.skip('Stress Tests', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('Stress')).tap();
  })

  it('should handle tap during busy bridge', function () {
    element(by.label('Bridge Stress')).tap();
    expect(element(by.label('Hello World!!!'))).toBeVisible();
  });

  it('should handle tap during busy JS event loop', function () {
    element(by.label('Events Stress')).tap();
    expect(element(by.label('Hello World!!!'))).toBeVisible();
  });

  describe('Consecutive Test', function () {
    const MULTI_TEST_COUNT = 20;
    for (let i = 0; i < MULTI_TEST_COUNT; i++) {
      it(`should handle tap in consecutive test #${i+1}`, function () {
        element(by.label('Say Hello')).tap();
        expect(element(by.label('Hello!!!'))).toBeVisible();
      });
    };
  });

});
