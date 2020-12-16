describe('Fake-timestamps provider', () => {
  it('should provide timestamps in fixed intervals', () => {
    const now = require('./fakeTimestampsProvider');
    expect(now()).toEqual(1000);
    expect(now()).toEqual(1100);
    expect(now()).toEqual(1200);
  });
});
