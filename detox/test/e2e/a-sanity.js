describe('Sanity', () => {
  beforeEach((done) => {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(() => {
    element(by.label('Sanity')).tap();
  });

  it('should have welcome screen', () => {
    expect(element(by.label('Welcome'))).toBeVisible();
    expect(element(by.label('Say Hello'))).toBeVisible();
    expect(element(by.label('Say World'))).toBeVisible();
  });

  it('should show hello screen after tap', () => {
    element(by.label('Say Hello')).tap();
    expect(element(by.label('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', () => {
    element(by.label('Say World')).tap();
    expect(element(by.label('World!!!'))).toBeVisible();
  });
});
