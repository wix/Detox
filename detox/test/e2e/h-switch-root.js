describe('switch root', () => {
  beforeEach(function (done) {
    simulator.reloadReactNativeApp(done);
  });

  it('switch root works', () => {
    element(by.label('Switch Root')).tap();
    element(by.label('Switch to a new native root')).tap();
    expect(element(by.label('this is a new native root'))).toBeVisible();
  });
});
