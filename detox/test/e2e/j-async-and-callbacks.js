describe('Async and Callbacks', () => {
  beforeEach((done) => {
    simulator.reloadReactNativeApp(done);
  });

  beforeEach(() => {
    element(by.label('Sanity')).tap();
  });

  it('should handle done() callback', (done) => {
    expect(element(by.label('Welcome'))).toBeVisible();
    setTimeout(() => {
      done();
    }, 1);
  });

  it('should handle async await', async () => {
    await timeout(1);
    expect(element(by.label('Welcome'))).toBeVisible();
  });
});

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
