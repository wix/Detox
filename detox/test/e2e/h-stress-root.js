describe('StressRoot', () => {
  beforeEach((done) => {
    simulator.relaunchApp(done);
  });

  beforeEach(() => {
    element(by.label('Switch Root')).tap();
  });

  after((done) => {
    simulator.relaunchApp(done);
  });

  it('should switch root view controller from RN to native', () => {
    element(by.label('Switch to a new native root')).tap();
    expect(element(by.label('this is a new native root'))).toBeVisible();
  });

  it('should switch root view controller from RN to RN', () => {
    element(by.label('Switch to multiple react roots')).tap();
    expect(element(by.label('Choose a test'))).toBeVisible();
  });
});
