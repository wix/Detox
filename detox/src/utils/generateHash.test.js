const generateHash = require('./generateHash');

describe('generateHash', () => {
  it('should throw EISDIR error for unknown file', async () => {
    await expect(generateHash(__dirname)).rejects.toThrow(/EISDIR/);
  });

  it('should generate hash for file', async () => {
    const path = require('path');
    const expected = 'd41d8cd98f00b204e9800998ecf8427e';
    const filePath = path.join(__dirname, `__mocks__/empty_hashtest.txt`);
    await expect(generateHash(filePath)).resolves.toBe(expected);
  });

  it('should throw error for empty path', async () => {
    await expect(generateHash(undefined)).rejects.toThrow(/Path must be provided for hash generation/);
  });
});
