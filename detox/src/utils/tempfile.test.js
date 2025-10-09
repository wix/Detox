describe('tempfile', () => {
  let tmp;
  let tempfile;

  describe('in full integration with tmp module', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
      tempfile = require('./tempfile');
    });

    it('should work with the real tmp module', () => {
      const tmpdir = require('node:os').tmpdir();
      const path = require('node:path');

      const expectedFile = path.join(tmpdir, `detox-${process.pid}-[a-zA-Z0-9]+.log`).replace(/\\/g, '\\\\');
      const expectedResult = new RegExp(`^(?:/private)?${expectedFile}$`);

      const result = tempfile('.log');
      expect(result).toMatch(expectedResult);
    });
  });

  describe('with mocked tmp module', () => {
    beforeEach(() => {
      jest.mock('tmp');
      tmp = require('tmp');
      tempfile = require('./tempfile');
    });

    const expectTmpCalled = ({ withExtension = '' } = {}) => {
      const template = `detox-${process.pid}-XXXXXX${withExtension}`;
      expect(tmp.tmpNameSync).toHaveBeenCalledWith({ template });
    };

    it(`should enable tmp's graceful cleanup`, () => {
      expect(tmp.setGracefulCleanup).toHaveBeenCalled();
    });

    it('should return the value from tmp.tmpNameSync', () => {
      const mockPath = '/tmp/detox-123-abc123';
      tmp.tmpNameSync.mockReturnValueOnce(mockPath);

      const result = tempfile();
      expect(result).toEqual(mockPath);
    });

    it('should create a temporary file path without extension', () => {
      tempfile();
      expectTmpCalled();
    });

    it('should create a temporary file path with extension', () => {
      tempfile('txt');
      expectTmpCalled({ withExtension: '.txt' });
    });

    it('should handle extension with leading dot', () => {
      tempfile('.txt');
      expectTmpCalled({ withExtension: '.txt' });
    });

    it('should handle empty extension', () => {
      tempfile('');
      expectTmpCalled();
    });

    it('should handle undefined extension', () => {
      tempfile();
      expectTmpCalled();
    });
  });
});
