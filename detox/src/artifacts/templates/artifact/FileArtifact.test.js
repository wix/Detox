const _ = require('lodash');
const fs = require('fs-extra');
const tempfile = require('tempfile');

describe('FileArtifact', () => {
  let FileArtifact, fileArtifact, logger, temporaryPath, destinationPath;

  beforeEach(() => {
    jest.mock('../../../utils/logger');
    logger = require('../../../utils/logger');
    FileArtifact = require('./FileArtifact');
    fileArtifact = null;
    temporaryPath = tempfile('.artifact');
    destinationPath = tempfile('.artifact');
  });

  afterEach(async () => await Promise.all([
    fs.remove(temporaryPath),
    fs.remove(destinationPath)
  ]));

  describe('save', () => {
    describe('if temporary file exists', () => {
      beforeEach(async () => {
        await fs.ensureFile(temporaryPath);
      });

      it('should move file to the specified location and log a message', async () => {
        fileArtifact = new FileArtifact({ temporaryPath });
        await fileArtifact.save(destinationPath);

        expect(await fs.exists(destinationPath)).toBe(true);
        expect(await fs.exists(temporaryPath)).toBe(false);

        expect(logger.debug).toHaveBeenCalledWith({ event: 'MOVE_FILE' }, expect.any(String));
      });
    });

    describe('if temporary file does not exist', () => {
      beforeEach(async () => {
        await fs.remove(temporaryPath);
      });

      it('should log a warning', async () => {
        fileArtifact = new FileArtifact({ temporaryPath });
        await fileArtifact.save(destinationPath);

        expect(await fs.exists(destinationPath)).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith({ event: 'MOVE_FILE_MISSING' }, expect.any(String));
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

      describe('and start() was never called', () => {
        it('should fail to find the file on save()', async () => {
          await fileArtifact.save(destinationPath);

          expect(await fs.exists(destinationPath)).toBe(false);
          expect(await fs.exists(temporaryPath)).toBe(false);
        });
      });

      describe('and start() was called', () => {
        beforeEach(async () => {
          await fileArtifact.start();
        });

        it('should move file successfully and log', async () => {
          await fileArtifact.save(destinationPath);

          expect(await fs.exists(destinationPath)).toBe(true);
          expect(await fs.exists(temporaryPath)).toBe(false);
          expect(logger.debug).toHaveBeenCalledWith({ event: 'MOVE_FILE' }, expect.any(String));
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

  describe('static helper methods', () => {
    describe('.moveTemporaryFile', () => {
      it('should move file from source to destination and log that', async () => {
        await fs.ensureFile(temporaryPath);
        await FileArtifact.moveTemporaryFile(logger, temporaryPath, destinationPath);

        expect(await fs.exists(destinationPath)).toBe(true);
        expect(logger.debug).toHaveBeenCalledWith({ event: 'MOVE_FILE' }, expect.any(String));
      });

      it('should log error if source file does not exist', async () => {
        await FileArtifact.moveTemporaryFile(logger, temporaryPath, destinationPath);

        expect(await fs.exists(destinationPath)).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith({ event: 'MOVE_FILE_MISSING' }, expect.any(String));
      });
    });
  });
});
