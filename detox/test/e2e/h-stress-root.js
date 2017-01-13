describe('StressRoot', function () {

  beforeEach(function (done) {
    simulator.relaunchApp(done);
  });

  beforeEach(function () {
    element(by.label('Switch Root')).tap();
  });

  after(function (done) {
    simulator.relaunchApp(done);
  });

  it('should switch root view controller from RN to native', function () {
    element(by.label('Switch to a new native root')).tap();
    expect(element(by.label('this is a new native root'))).toBeVisible();
  });

  it('should switch root view controller from RN to RN', function () {
    element(by.label('Switch to multiple react roots')).tap();
    expect(element(by.label('Choose a test'))).toBeVisible();
  });

});
