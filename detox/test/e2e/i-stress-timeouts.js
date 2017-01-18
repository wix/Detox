describe('StressTimeouts', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('Timeouts')).tap();
  });

  it('should handle a short timeout', function () {
    element(by.id('TimeoutShort')).tap();
    expect(element(by.label('Short Timeout Working!!!'))).toBeVisible();
  });

  it('should handle zero timeout', function () {
    element(by.id('TimeoutZero')).tap();
    expect(element(by.label('Zero Timeout Working!!!'))).toBeVisible();
  });

  it('should ignore a short timeout', function () {
    element(by.id('TimeoutIgnoreShort')).tap();
    expect(element(by.label('Short Timeout Ignored!!!'))).toBeVisible();
  });

  it('should ignore a long timeout', function () {
    element(by.id('TimeoutIgnoreLong')).tap();
    expect(element(by.label('Long Timeout Ignored!!!'))).toBeVisible();
  });

  it('should handle setImmediate', function () {
    element(by.id('Immediate')).tap();
    expect(element(by.label('Immediate Working!!!'))).toBeVisible();
  });

  it('should ignore setInterval', function () {
    element(by.id('IntervalIgnore')).tap();
    expect(element(by.label('Interval Ignored!!!'))).toBeVisible();
  });

});
