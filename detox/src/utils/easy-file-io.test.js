describe('Easy-file I/O utilities', () => {
  describe('For base-64 encoded data', () => {
    const data = 'VGhlcmUgaXMgbm8gc3Bvb24h'; // There is no spoon!
    const filePath = 'path/to/file.ext'
    const tempFilePath = '/path/to/temp-file.ext';

    const writtenBuffer = () => fs.writeFileSync.mock.calls[0][1];

    let fs;
    let tempfile;
    let uut;
    beforeEach(() => {
      jest.mock('fs');
      fs = require('fs');

      jest.mock('tempfile');
      tempfile = require('tempfile');
      tempfile.mockReturnValue(tempFilePath);

      uut = require('./easy-file-io');
    });

    it('should save raw data to a given file', () => {
      const opts = {
        filePath
      };
      uut.saveRawBase64Data(data, opts);
      expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, expect.any(Buffer));
      expect(writtenBuffer().toString('ascii')).toEqual('There is no spoon!');
    });

    it('should return path to file', () => {
      const opts = {
        filePath
      };
      const resultPath = uut.saveRawBase64Data(data, opts);
      expect(resultPath).toEqual(filePath);
    });

    it('should resort to a self-allocated temp-file', () => {
      const resultPath = uut.saveRawBase64Data(data, {});
      expect(fs.writeFileSync).toHaveBeenCalledWith(tempFilePath, expect.anything());
      expect(resultPath).toEqual(tempFilePath);
    });

    it('should apply a temp-file suffix', () => {
      const opts = {
        fileSuffix: '.mock-suffix.bin',
      }
      uut.saveRawBase64Data(data, opts);
      expect(tempfile).toHaveBeenCalledWith(opts.fileSuffix);
    });
  });
});
