describe('bug hunt', () => {
  //beforeEach((done) => {
  //  global.simulator.relaunchApp(done);
  //});

  it('switch to a new native root works', () => {
    element(by.label('Switch Root')).tap();
    element(by.label('Switch to a new native root')).tap();
    expect(element(by.label('this is a new native root'))).toBeVisible();
  });

  it.only('switch to a multiple react roots works', () => {
    element(by.label('Switch Root')).tap();
    element(by.label('Switch to multiple react roots')).tap();
    expect(element(by.label('Choose a test'))).toBeVisible();
  });
});
