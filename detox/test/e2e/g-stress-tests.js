describe('StressTests', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('Stress')).tap();
  });

  it('should handle tap during busy bridge (one way)', function () {
    element(by.label('Bridge OneWay Stress')).tap();
    element(by.label('Next')).tap();
    expect(element(by.label('BridgeOneWay'))).toBeVisible();
  });

  it('should handle tap during busy bridge (two way)', function () {
    element(by.label('Bridge TwoWay Stress')).tap();
    element(by.label('Next')).tap();
    expect(element(by.label('BridgeTwoWay'))).toBeVisible();
  });

  it('should handle tap during busy bridge (setState)', function () {
    element(by.label('Bridge setState Stress')).tap();
    element(by.label('Next')).tap();
    expect(element(by.label('BridgeSetState'))).toBeVisible();
  });

  it('should handle tap during busy JS event loop', function () {
    element(by.label('EventLoop Stress')).tap();
    element(by.label('Next')).tap();
    expect(element(by.label('EventLoop'))).toBeVisible();
  });

  it('should handle consecutive taps', function () {
    const TAP_COUNT = 20;
    for (let i = 1 ; i <= TAP_COUNT ; i++) {
      element(by.label('Consecutive Stress ' + i)).tap();
    }
  });

});
