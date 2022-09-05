const { assertSupportedVersion } = require('./assertJestCircus27');

describe('assertSupportedVersion', () => {
  test.each([
    ['27.2.5'],
    ['27.2.6-prerelease.0'],
    ['27.3.0'],
    ['28.0.0-alpha.1'],
    ['28.0.0'],
    ['28.1.0'],
    ['29.0.0-next.0'],
    ['30.0.0'],
  ])('should pass for %j', (version) => {
    expect(() => assertSupportedVersion(version)).not.toThrow();
  });

  test.each([
    ['26.0.0'],
    ['27.2.4'],
  ])('should throw an error for %j', (version) => {
    expect(() => assertSupportedVersion(version)).toThrowError(/unsupported jest.*version/);
  });
});
