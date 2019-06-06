const getTimeStampString = require('./getTimeStampString');

describe(getTimeStampString.name, () => {
  it('should format date', () => {
    const date = new Date(Date.UTC(2015, 5, 15, 15, 2, 58));
    expect(getTimeStampString(date)).toBe('2015-06-15 15-02-58Z');
    expect(typeof getTimeStampString()).toBe('string');
  });
});
