const uut = require('./shouldUseOptimizedInstall');

describe('shouldUseOptimizedInstall', () => {
  it('should return true for android without useLegacyLaunchApp', () => {
    expect(uut('android', false)).toBe(true);
  });

  it('should return false for android with useLegacyLaunchApp', () => {
    expect(uut('android', true)).toBe(false);
  });

  it('should return false for ios without useLegacyLaunchApp', () => {
    expect(uut('ios', false)).toBe(false);
  });

  it('should return false for ios with useLegacyLaunchApp', () => {
    expect(uut('ios', true)).toBe(false);
  });
});
