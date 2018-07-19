const regexEscape = require('./regexEscape');

describe(regexEscape.name, () => {
  it('should not escape non-special characters', () => {
    const nonspecial = 'bundle_name';
    expect(regexEscape(nonspecial)).toBe(nonspecial);
  });

  it('should escape [\\]', () => {
    const bundleId = '[kworker\\0:0]';
    expect(regexEscape(bundleId)).toBe('\\[kworker\\\\0:0\\]');
  });

  it('should escape ^*$', () => {
    const bundleId = '^ma*tch$';
    expect(regexEscape(bundleId)).toBe('\\^ma\\*tch\\$');
  });

  it('should escape dots', () => {
    const bundleId = 'com.company.bundle';
    expect(regexEscape(bundleId)).toBe('com\\.company\\.bundle');
  });
});
