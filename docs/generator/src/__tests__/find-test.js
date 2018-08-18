const { findDocumentedFiles } = require('../find');
const glob = require('glob').sync;
const readFileSync = require('fs').readFileSync;

jest.mock('glob', () => ({
  sync: jest.fn()
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const pathToContent = {
  '/expect.js': `
  /**
   * @Documented
   * id: expect
   * title: Expectations
   * platform: general
   * 
   **/
  `,
  '/somethingDifferent.js': `const foo = 42; `
};

describe('findDocumentedFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('gets all files matching the glob', () => {
    glob.mockReturnValueOnce(['/expect.js']);
    readFileSync.mockImplementation((path) => pathToContent[path]);

    findDocumentedFiles(__dirname, './**/*.js');

    expect(glob).toHaveBeenCalledTimes(1);
    expect(readFileSync).toHaveBeenCalledWith('/expect.js', 'utf-8');
  });

  it('only includes files with a documentation header', () => {
    glob.mockReturnValueOnce(['/expect.js', '/somethingDifferent.js']);
    readFileSync.mockImplementation((path) => pathToContent[path]);

    expect(findDocumentedFiles(__dirname, './**/*.js')).toEqual([['/expect.js', pathToContent['/expect.js']]]);
    expect(glob).toHaveBeenCalled();
    expect(readFileSync).toHaveBeenCalledTimes(2);
  });
});
