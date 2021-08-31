const path = require('path');

const fs = require('fs-extra');
const tempfile = require('tempfile');

const fsext = require('./fsext');

test('isDirEmptySync', async () => {
  const tempDir = tempfile();
  try {
    expect(() => fsext.isDirEmptySync(tempDir)).toThrowError(/ENOENT/);

    await fs.ensureDir(tempDir);
    expect(fsext.isDirEmptySync(tempDir)).toBe(true);

    await fs.ensureFile(path.join(tempDir, '1'));
    expect(fsext.isDirEmptySync(tempDir)).toBe(false);
  } finally {
    await fs.remove(tempDir);
  }
});
