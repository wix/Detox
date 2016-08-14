const MULTI_TEST_COUNT = 100;

describe('Stressful Use', function() {
  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  it('should handle tap during conditions of stressful bridge', function() {
    element(by.label('StressScreen')).tap();
    element(by.label('Bridge Stress')).tap();
    expect(element(by.label('Hello World!!!'))).toBeVisible();
  });

  it('should handle tap during conditions of stressful JS event loop', function() {
    element(by.label('StressScreen')).tap();
    element(by.label('Events Stress')).tap();
    expect(element(by.label('Hello World!!!'))).toBeVisible();
  });

  describe('Consecutive Test', function() {
    for (let i = 0; i < MULTI_TEST_COUNT; i++) {
      it(`should handle tap in stress consecutive test #${i+1}`, function () {
        element(by.label('StressScreen')).tap();
        element(by.label('Say Hello')).tap();
        expect(element(by.label('Hello!!!'))).toBeVisible();
      });
    };
  })

});
