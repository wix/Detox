const outputMapping = require('../outputMapping');

const documentation = {
  id: 'element',
  paths: ['android/expect.js']
};

describe('outputMapping', () => {
  it('returns a function', () => {
    expect(outputMapping('../generated-docs')).toBeInstanceOf(Function);
  });

  it('removes the last segment of the path', () => {
    expect(outputMapping('../generated-docs')(documentation)).toEqual(expect.not.stringContaining('expect'));
  });

  it('adss the id as the last segment of the path', () => {
    expect(outputMapping('../generated-docs')(documentation)).toEqual(expect.stringContaining('element'));
  });

  it('writes the output under the output path passed into first function', () => {
    expect(outputMapping('../generated-docs')(documentation)).toEqual(expect.stringContaining('generated-docs'));
  });

  it('writes the output under the output path passed into first function', () => {
    expect(outputMapping('../generated-docs')(documentation)).toEqual(expect.stringContaining('.md'));
  });
});
