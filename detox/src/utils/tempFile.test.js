const path = require('path');

const fs = require('fs-extra');

describe('Temporary local file util', () => {
  const filename = 'file-detox.tmp';

  let tempFileUtil;
  beforeEach(() => {
    tempFileUtil = require('./tempFile');
  });

  it('should return a file path', async () => {
    const tempFile = tempFileUtil.create(filename);
    expect(tempFile.path).toBeDefined();
  });

  it('should create a directory', async () => {
    const tempFile = tempFileUtil.create(filename);
    const filePath = path.dirname(tempFile.path);
    await expect( fs.pathExists(filePath) ).resolves.toEqual(true);
  });

  it('should provide a clean-up method', async () => {
    const tempFile = tempFileUtil.create(filename);
    const filePath = path.dirname(tempFile.path);

    tempFile.cleanup();

    await expect( fs.pathExists(tempFile) ).resolves.toEqual(false);
    await expect( fs.pathExists(filePath) ).resolves.toEqual(false);
  });
});
