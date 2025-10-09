const path = require('path');

const fs = require('fs-extra');

const fsext = require('./fsext');
const tempfile = require('./tempfile');

test('copy', () => {
  expect(fsext.copy).toBe(fs.copy);
});

test('ensureDir', () => {
  expect(fsext.ensureDir).toBe(fs.ensureDir);
});

test('exists', () => {
  expect(fsext.exists).toBe(fs.exists);
});

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

test('remove', async () => {
  const tempDir = tempfile();
  await fs.ensureDir(tempDir);
  expect(await fsext.remove(tempDir)).toBe(true);
  expect(await fsext.remove(tempDir)).toBe(false);
});
