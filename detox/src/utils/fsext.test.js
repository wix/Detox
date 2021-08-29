const path = require('path');

const fs = require('fs-extra');
const tempfile = require('tempfile');

const fsext = require('./fsext');

test('isDirEmpty', async () => {
  const tempDir = tempfile();
  try {
    await expect(fsext.isDirEmpty(tempDir)).rejects.toThrowError(/ENOENT/);

    await fs.ensureDir(tempDir);
    await expect(fsext.isDirEmpty(tempDir)).resolves.toBe(true);

    await fs.ensureFile(path.join(tempDir, '1'));
    await expect(fsext.isDirEmpty(tempDir)).resolves.toBe(false);
  } finally {
    await fs.remove(tempDir);
  }
});
