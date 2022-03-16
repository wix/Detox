const fs = require('fs-extra');
const _ = require('lodash');
const tempfile = require('tempfile');

describe('FileArtifact', () => {
  let FileArtifact, fileArtifact, logger, temporaryPath, temporaryData, destinationPath;

  beforeEach(async () => {
    jest.mock('../../../utils/logger');
    logger = require('../../../utils/logger');
    FileArtifact = require('./FileArtifact');
    fileArtifact = null;
    temporaryPath = tempfile('.artifact');
    destinationPath = tempfile('.artifact');
    temporaryData = 'Just a usual string to be saved to the file';
  });

  afterEach(async () => {
    await Promise.all([
      fs.remove(temporaryPath),
      fs.remove(destinationPath)
    ]);
  });

  describe('save', () => {
    beforeEach(() => {
      jest.spyOn(FileArtifact, 'moveTemporaryFile').mockImplementation(_.noop);
      jest.spyOn(FileArtifact, 'writeFile').mockImplementation(_.noop);
    });

    describe('if temporary file is passed to constructor', () => {
      beforeEach(() => {
        fileArtifact = new FileArtifact({
          name: 'CustomArtifact',
          temporaryPath,
        });
      });

      describe('when called simply', () => {
        beforeEach(async () => {
          await fileArtifact.save(destinationPath);
        });

        it('should call FileArtifact.moveTemporaryFile', async () => {
          expect(FileArtifact.moveTemporaryFile).toHaveBeenCalledWith(logger, temporaryPath, destinationPath, undefined);
        });
      });

      describe('when called with { append: true }', () => {
        beforeEach(async () => {
          await fileArtifact.save(destinationPath, { append: true });
        });

        it('should call FileArtifact.moveTemporaryFile with extra param', async () => {
          expect(FileArtifact.moveTemporaryFile).toHaveBeenCalledWith(logger, temporaryPath, destinationPath, true);
        });
      });
    });

    describe('if temporary file is created in start()', () => {
      beforeEach(() => {
        fileArtifact = new FileArtifact({
          name: 'CustomArtifact',
          async start() {
            await fs.ensureFile(temporaryPath);
            this.temporaryPath = temporaryPath;
          }
        });
      });

      describe('when save() is called without start()', () => {
        beforeEach(async () => {
          await fileArtifact.save(destinationPath);
        });

        it('should not call FileArtifact.moveTemporaryFile', async () => {
          await fileArtifact.save(destinationPath);
          expect(FileArtifact.moveTemporaryFile).not.toHaveBeenCalled();
        });
      });

      describe('and start() was called', () => {
        beforeEach(async () => {
          await fileArtifact.start();
          await fileArtifact.save(destinationPath);
        });

        it('should call FileArtifact.moveTemporaryFile', async () => {
          expect(FileArtifact.moveTemporaryFile).toHaveBeenCalledWith(logger, temporaryPath, destinationPath, undefined);
        });
      });
    });

    describe('if temporary data is passed to constructor', () => {
      beforeEach(() => {
        fileArtifact = new FileArtifact({
          name: 'CustomArtifact',
          temporaryData,
        });
      });

      describe('when called simply', () => {
        beforeEach(async () => {
          await fileArtifact.save(destinationPath);
        });

        it('should call FileArtifact.writeFile', async () => {
          expect(FileArtifact.writeFile).toHaveBeenCalledWith(logger, temporaryData, destinationPath, undefined);
        });
      });

      describe('when called with { append: true }', () => {
        beforeEach(async () => {
          await fileArtifact.save(destinationPath, { append: true });
        });

        it('should call FileArtifact.moveTemporaryFile with extra param', async () => {
          expect(FileArtifact.writeFile).toHaveBeenCalledWith(logger, temporaryData, destinationPath, true);
        });
      });
    });
  });

  describe('discard', () => {
    describe('if temporary file exists', () => {
      beforeEach(async () => {
        await fs.ensureFile(temporaryPath);
      });

      it('should remove the temporary file', async () => {
        const fileArtifact = new FileArtifact({ temporaryPath });
        await fileArtifact.discard(destinationPath);
        expect(await fs.exists(temporaryPath)).toBe(false);
      });
    });

    describe('if temporary file does not exist', () => {
      beforeEach(async () => {
        await fs.remove(temporaryPath);
      });

      it('should not log warnings', async () => {
        const fileArtifact = new FileArtifact({ temporaryPath });
        await fileArtifact.discard(destinationPath);

        expect(logger.warn).not.toHaveBeenCalled();
      });
    });
  });

  describe('relocate', () => {
    beforeEach(() => {
      jest.spyOn(FileArtifact, 'moveTemporaryFile').mockImplementation(_.noop);
      jest.spyOn(FileArtifact, 'writeFile').mockImplementation(_.noop);
    });

    describe('if temporary file is passed to constructor', () => {
      beforeEach(() => {
        fileArtifact = new FileArtifact({
          name: 'CustomArtifact',
          temporaryPath,
        });
      });

      describe('and the file exists', () => {
        beforeEach(async () => {
          await fs.ensureFile(temporaryPath);
        });

        describe('when called', () => {
          beforeEach(async () => {
            await fileArtifact.relocate();
          });

          it('should call FileArtifact.moveTemporaryFile', async () => {
            expect(FileArtifact.moveTemporaryFile).toHaveBeenCalledWith(logger, temporaryPath, expect.stringMatching(/\.artifact$/));
          });
        });
      });

      describe('and the file does not exist', () => {
        beforeEach(async () => {
          await fs.remove(temporaryPath);
        });

        describe('when called', () => {
          beforeEach(async () => {
            await fileArtifact.relocate();
          });

          it('should call FileArtifact.moveTemporaryFile', async () => {
            expect(FileArtifact.moveTemporaryFile).not.toHaveBeenCalled();
          });
        });
      });
    });

    describe('if temporary file is created in start()', () => {
      beforeEach(() => {
        fileArtifact = new FileArtifact({
          name: 'CustomArtifact',
          async start() {
            await fs.ensureFile(temporaryPath);
            this.temporaryPath = temporaryPath;
          }
        });
      });

      describe('when relocate() is called without start()', () => {
        beforeEach(async () => {
          await fileArtifact.relocate();
        });

        it('should not call FileArtifact.moveTemporaryFile', async () => {
          expect(FileArtifact.moveTemporaryFile).not.toHaveBeenCalled();
        });
      });

      describe('and start() was called', () => {
        beforeEach(async () => {
          await fileArtifact.start();
          await fileArtifact.relocate();
        });

        it('should call FileArtifact.moveTemporaryFile', async () => {
          expect(FileArtifact.moveTemporaryFile).toHaveBeenCalledWith(logger, temporaryPath, expect.stringMatching(/\.artifact$/));
        });
      });
    });

    describe('if temporary data is passed to constructor', () => {
      beforeEach(() => {
        fileArtifact = new FileArtifact({
          name: 'CustomArtifact',
          temporaryData,
        });
      });

      describe('when called', () => {
        beforeEach(async () => {
          await fileArtifact.relocate();
        });

        it('should not do anything', async () => {
          expect(FileArtifact.moveTemporaryFile).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('static helper methods', () => {
    describe('.moveTemporaryFile', () => {
      describe('if temporary file does not exist', () => {
        beforeEach(async () => {
          await fs.remove(temporaryPath);
          await fs.writeFile(destinationPath, 'Hello');
        });

        it('should log a warning', async () => {
          const result = await FileArtifact.moveTemporaryFile(logger, temporaryPath, destinationPath);

          expect(result).toBe(false);
          expect(await fs.readFile(destinationPath, 'utf8')).toBe('Hello');
          expect(logger.warn).toHaveBeenCalledWith({ event: 'MOVE_FILE_MISSING' }, expect.any(String));
        });
      });

      describe('if temporary file exists', () => {
        beforeEach(async () => {
          await fs.ensureFile(temporaryPath);
        });

        describe('and the destination file does not exist', () => {
          beforeEach(async () => {
            await fs.remove(destinationPath);
          });

          it('should move file to the specified location and log a message', async () => {
            const result = await FileArtifact.moveTemporaryFile(logger, temporaryPath, destinationPath);

            expect(result).toBe(true);
            expect(await fs.exists(destinationPath)).toBe(true);
            expect(await fs.exists(temporaryPath)).toBe(false);

            expect(logger.debug).toHaveBeenCalledWith({ event: 'MOVE_FILE' }, expect.any(String));
          });
        });

        describe('and the destination file exists', () => {
          beforeEach(async () => {
            await fs.writeFile(destinationPath, 'My file');
            await fs.writeFile(temporaryPath, ' and more to it');
          });

          it('should remove temporary file but refuse to append file', async () => {
            const result = await FileArtifact.moveTemporaryFile(logger, temporaryPath, destinationPath);

            expect(result).toBe(false);
            expect(await fs.exists(temporaryPath)).toBe(false);
            expect(await fs.readFile(destinationPath, 'utf8')).toBe('My file');

            expect(logger.warn).toHaveBeenCalledWith({ event: 'MOVE_FILE_EXISTS' }, expect.any(String));
          });

          it('should move temporary file via appending if canAppend = true', async () => {
            const result = await FileArtifact.moveTemporaryFile(logger, temporaryPath, destinationPath, true);

            expect(result).toBe(true);
            expect(await fs.exists(temporaryPath)).toBe(false);
            expect(await fs.readFile(destinationPath, 'utf8')).toBe('My file and more to it');

            expect(logger.debug).toHaveBeenCalledWith({ event: 'MOVE_FILE' }, expect.stringContaining('appending'));
          });
        });
      });
    });

    describe('.writeFile', () => {
      describe('if there is no temporary data', () => {
        beforeEach(async () => {
          await fs.writeFile(destinationPath, 'Hello');
        });

        it('should log a warning', async () => {
          const result = await FileArtifact.writeFile(logger, undefined, destinationPath);

          expect(result).toBe(false);
          expect(await fs.readFile(destinationPath, 'utf8')).toBe('Hello');
          expect(logger.warn).toHaveBeenCalledWith({ event: 'FILE_WRITE_EMPTY_DATA' }, expect.any(String));
        });
      });

      describe('if there is a data', () => {
        describe('if there is no destination file', () => {
          beforeEach(async () => {
            await fs.remove(destinationPath);
          });

          it('should log a debug message', async () => {
            const result = await FileArtifact.writeFile(logger, temporaryData, destinationPath);

            expect(result).toBe(true);
            expect(logger.debug).toHaveBeenCalledWith({ event: 'FILE_WRITE_CREATE' }, expect.any(String));
          });

          it('should create the file', async () => {
            const result = await FileArtifact.writeFile(logger, temporaryData, destinationPath);

            expect(result).toBe(true);
            expect(await fs.readFile(destinationPath, 'utf8')).toBe(temporaryData);
          });
        });

        describe('if the destination file exists', () => {
          const fileContent = 'Hello';

          beforeEach(async () => {
            await fs.writeFile(destinationPath, fileContent);
          });

          describe('usual mode', () => {
            it('should refuse overwriting the file', async () => {
              const result = await FileArtifact.writeFile(logger, temporaryData, destinationPath);

              expect(result).toBe(false);
              expect(logger.warn).toHaveBeenCalledWith({ event: 'FILE_WRITE_EXISTS' }, expect.any(String));
            });
          });

          describe('append mode', () => {
            it('should append to the file', async () => {
              const result = await FileArtifact.writeFile(logger, temporaryData, destinationPath, true);

              expect(result).toBe(true);
              expect(await fs.readFile(destinationPath, 'utf8')).toBe(fileContent + temporaryData);
              expect(logger.debug).toHaveBeenCalledWith({ event: 'FILE_WRITE' }, expect.any(String));
            });
          });
        });
      });
    });
  });
});
