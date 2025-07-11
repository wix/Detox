const path = require('path');

const fs = require('fs-extra');

const fsext = require('./fsext');
const tempfile = require('./tempfile');


test('isDirEmptySync', async () => {
  const tempDir = tempfile();
  try {
    expect(() => fsext.isDirEmptySync(tempDir)).toThrow(/ENOENT/);

    await fs.ensureDir(tempDir);
    expect(fsext.isDirEmptySync(tempDir)).toBe(true);

    await fs.ensureFile(path.join(tempDir, '1'));
    expect(fsext.isDirEmptySync(tempDir)).toBe(false);
  } finally {
    await fs.remove(tempDir);
  }
});

test('readdirSync', async () => {
  expect(fsext.readdirSync).toBe(fs.readdirSync);
});
