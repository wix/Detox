const ensureExtension = require('./ensureExtension');

describe(ensureExtension, () => {
  it('should append extension to filename if there is no one', () => {
    expect(ensureExtension('filename', '.ext')).toBe('filename.ext');
  });

  it('should append extension to filename if there is different extension', () => {
    expect(ensureExtension('filename.png', '.mp4')).toBe('filename.png.mp4');
  });

  it('should not append extension to filename if it is there already', () => {
    expect(ensureExtension('filename.mp4', '.mp4')).toBe('filename.mp4');
  });

  it('should not append extension to filename if there is no extension given', () => {
    expect(ensureExtension('filename.mp4')).toBe('filename.mp4');
  });
});

