const path = require('path');

const getAbsoluteBinaryPath = require('./getAbsoluteBinaryPath');

describe('getAbsoluteBinaryPath', () => {
  it('should return the given path if it is already absolute', async () => {
    expect(getAbsoluteBinaryPath('/my/absolute/path')).toEqual('/my/absolute/path');
  });

  it('should return an absolute path if a relative path is passed in', async () => {
    expect(getAbsoluteBinaryPath('src/utils/getAbsoluteBinaryPath.js')).toEqual(path.join(process.cwd(), 'src/utils/getAbsoluteBinaryPath.js'));
  });

  it('should throw exception if resulting absolute path does not exist', async () => {
    expect(() => getAbsoluteBinaryPath('my/relative/path'))
      .toThrowError();
  });
});

