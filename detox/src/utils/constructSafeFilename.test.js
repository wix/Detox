const constructSafeFilename = require('./constructSafeFilename');

describe('constructSafeFilename', () => {
  it('should throw if no arguments passed', () => {
    let prefix, name, suffix;

    expect(() => constructSafeFilename())
      .toThrowErrorMatchingSnapshot();
    expect(() => constructSafeFilename(prefix, name, suffix))
      .toThrowErrorMatchingSnapshot();
  });

  it('should trim filename to 255 chars', () => {
    const actual = constructSafeFilename('', '1'.repeat(256), '');
    const expected = '1'.repeat(255);

    expect(actual).toBe(expected);
  });

  it('should add non-trimmable prefix to filename', () => {
    const actual = constructSafeFilename('0'.repeat(55), '1'.repeat(201));
    const expected = '0'.repeat(55) + '1'.repeat(200);

    expect(actual).toBe(expected);
  });

  it('should add non-trimmable prefix and suffix to filename', () => {
    const actual = constructSafeFilename('0'.repeat(55), '1'.repeat(101), '2'.repeat(100));
    const expected = '0'.repeat(55) + '1'.repeat(100) + '2'.repeat(100);

    expect(actual).toBe(expected);
  });

  it('should throw exception when non-trimmable prefix and suffix occupy too much space', () => {
    expect(() => constructSafeFilename('0'.repeat(127), '1', '2'.repeat(128))).toThrowErrorMatchingSnapshot();
  });
});
