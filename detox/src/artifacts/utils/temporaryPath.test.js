const path = require('path');

const fs = require('fs-extra');
const tempfile = require('tempfile');

const temporaryPath = require('./temporaryPath');

describe('temporaryPath', () => {
  describe.each([
    ['json'],
    ['jsonl'],
    ['png'],
    ['log'],
    ['mp4'],
    ['dtxrec'],
    ['viewhierarchy'],
  ])('for.%s', (ext) => {
    it(`should generate a temporary path with the correct extension`, () => {
      expect(path.dirname(temporaryPath.for[ext]())).toBe(path.dirname(tempfile()));
      expect(temporaryPath.for[ext]()).toMatch(new RegExp(`.+\\.detox\\.${ext}$`));
    });

    it(`should generate a temporary path with specified name and correct extension`, () => {
      const basename = Math.random().toString(36).slice(2);
      const tempPath = temporaryPath.for[ext](basename);
      expect(path.dirname(temporaryPath.for[ext]())).toBe(path.dirname(tempfile()));
      expect(path.basename(tempPath, `.detox.${ext}`)).toBe(basename);
    });
  });

  describe.each([
    ['jsonl'],
  ])('find.%s', (ext) => {
    let file1, file2;

    beforeEach(async () => {
      file1 = temporaryPath.for[ext]('ABC.DEF');
      file2 = temporaryPath.for[ext]('XYZ.DEF');
      await fs.ensureFile(file1);
      await fs.ensureFile(file2);
    });

    afterEach(async () => {
      await fs.remove(file1);
      await fs.remove(file2);
    });

    describe('.sync', () => {
      it('should find temporary files by mask synchronously', async () => {
        expect(temporaryPath.find[ext].sync('ABC.DEF')).toEqual([file1]);
        expect(temporaryPath.find[ext].sync('ABC.*')).toEqual([file1]);
        expect(temporaryPath.find[ext].sync('*.DEF')).toEqual([file1, file2]);
      });
    });

    describe('.async', () => {
      it('should find temporary files by mask asynchronously', async () => {
        await expect(temporaryPath.find[ext].async('ABC.DEF')).resolves.toEqual([file1]);
        await expect(temporaryPath.find[ext].async('ABC.*')).resolves.toEqual([file1]);
        await expect(temporaryPath.find[ext].async('*.DEF')).resolves.toEqual([file1, file2]);
      });
    });
  });
});
