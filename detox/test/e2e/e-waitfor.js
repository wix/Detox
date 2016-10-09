describe('WaitFor', function () {

  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(function () {
    element(by.label('WaitFor')).tap();
  });

  it('should find element by scrolling until it is visible', function () {
    expect(element(by.label('Text5'))).toBeNotVisible();
    waitFor(element(by.label('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
    expect(element(by.label('Text5'))).toBeVisible();
  });

});
