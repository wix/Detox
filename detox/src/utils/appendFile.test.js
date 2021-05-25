const fs = require('fs-extra');
const tempfile = require('tempfile');

const appendFile = require('./appendFile');

describe('appendFile', () => {
  let src, dest;

  beforeEach(() => {
    src = tempfile();
    dest = tempfile();
  });

  afterEach(async () => {
    await Promise.all([src, dest].map(f => fs.remove(f)));
  });

  it('should throw error if source file does not exist', async () => {
    await expect(appendFile(tempfile(), dest)).rejects.toThrowError(/ENOENT/);
  });

  it('should append source file contents to destination file contents', async () => {
    await fs.writeFile(dest, 'Begin\n');
    await fs.writeFile(src, 'End');

    await appendFile(src, dest);
    expect(await fs.readFile(dest, 'utf8')).toEqual('Begin\nEnd');
  });

  it('should create a new file in destination if it does not exist', async () => {
    await fs.writeFile(src, 'Begin and End');

    await appendFile(src, dest);
    expect(await fs.readFile(dest, 'utf8')).toEqual('Begin and End');
  });
});
