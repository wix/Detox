const outputMapping = require('../outputMapping');

describe('outputMapping', () => {
  it('returns a function', () => {
    expect(outputMapping('../generated-docs')).toBeInstanceOf(Function);
  });
  it('takes the last segment of the path as name', () => {
    expect(outputMapping('../generated-docs')(['android/expect.js'])).toEqual(expect.stringContaining('expect'));
  });

  it('writes the output under the output path passed into first function', () => {
    expect(outputMapping('../generated-docs')(['android/expect.js'])).toEqual(expect.stringContaining('generated-docs'));
  });

  it('writes the output under the output path passed into first function', () => {
    expect(outputMapping('../generated-docs')(['android/expect.js'])).toEqual(expect.stringContaining('.md'));
  });
});
