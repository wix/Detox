jest.mock('../../../utils/logger');

const _ = require('lodash');
const fs = require('fs-extra');
const tempfile = require('tempfile');
const Artifact = require('./Artifact');

describe(Artifact.name, () => {
  let logger;

  beforeEach(() => {
    logger = require('../../../utils/logger');
  });

  describe('extends Artifact', () => {
    let artifact;

    class ArifactExtensionTest extends Artifact {
      constructor() {
        super();

        this.doStart = jest.fn().mockImplementation(() => super.doStart());
        this.doStop = jest.fn().mockImplementation(() => super.doStop());
        this.doSave = jest.fn().mockImplementation(() => super.doSave());
        this.doDiscard = jest.fn().mockImplementation(() => super.doDiscard());
      }
    }

    beforeEach(() => {
      artifact = new ArifactExtensionTest();
    });

    it('should have a name', () => {
      expect(artifact.name).toBe(ArifactExtensionTest.name);
    });

    it('should pass a regular save flow', async () => {
      expect(artifact.doStart).not.toHaveBeenCalled();
      await artifact.start();
      expect(artifact.doStart).toHaveBeenCalled();

      expect(artifact.doStop).not.toHaveBeenCalled();
      await artifact.stop();
      expect(artifact.doStop).toHaveBeenCalled();

      expect(artifact.doSave).not.toHaveBeenCalled();
      await artifact.save('path/to/artifact');
      expect(artifact.doSave).toHaveBeenCalledWith('path/to/artifact');
    });

    it('should pass a regular discard flow', async () => {
      expect(artifact.doStart).not.toHaveBeenCalled();
      await artifact.start();
      expect(artifact.doStart).toHaveBeenCalled();

      expect(artifact.doStop).not.toHaveBeenCalled();
      await artifact.stop();
      expect(artifact.doStop).toHaveBeenCalled();

      expect(artifact.doDiscard).not.toHaveBeenCalled();
      await artifact.discard();
      expect(artifact.doDiscard).toHaveBeenCalled();
    });

    it('should pass a fast synchronous workflow', async () => {
      artifact.start();
      artifact.stop();
      artifact.save('/path/to/artifact');
      await artifact.save();

      expect(artifact.doStart).toHaveBeenCalledTimes(1);
      expect(artifact.doStop).toHaveBeenCalledTimes(1);
      expect(artifact.doSave).toHaveBeenCalledTimes(1);
      expect(artifact.doSave).toHaveBeenCalledWith('/path/to/artifact');
    });

    describe('.start()', () => {
      describe('if no other methods have been called', () => {
        it('should call protected .doStart() method and pass args to it', async () => {
          await artifact.start(1, 2, 3);
          expect(artifact.doStart).toHaveBeenCalledWith(1, 2, 3);
        });

        it('should reject if the protected .doStart() rejects', async () => {
          const err = new Error();

          artifact.doStart.mockReturnValue(Promise.reject(err));
          await expect(artifact.start()).rejects.toThrow(err);
        });
      });

      describe('if .start() has been called before', () => {
        beforeEach(async () => artifact.start());

        it('should call .stop() and .start() again', async () => {
          expect(artifact.doStop).not.toHaveBeenCalled();

          await artifact.start(1, 2, 3, 4);
          expect(artifact.doStop).toHaveBeenCalled();
          expect(artifact.doStart).toHaveBeenCalledTimes(2);
        });
      });

      describe('if .save() has been called before', () => {
        beforeEach(async () => {
          await artifact.start();
          await artifact.save('artifactPath');
        });

        it('should wait till .save() ends and .start() again', async () => {
          await artifact.start(1, 2, 3, 4);
          expect(artifact.doStart).toHaveBeenCalledTimes(2);
          // TODO: assert the correct execution order
        });
      });

      describe('if .save() has been rejected before', () => {
        let err;

        beforeEach(async () => {
          artifact.doSave.mockReturnValue(Promise.reject(err = new Error()));
          await artifact.start();
          await artifact.save('artifactPath').catch(_.noop);
        });

        it('should reject as well', async () => {
          await expect(artifact.start()).rejects.toThrow(err);
        });
      });

      describe('if .discard() has been called before', () => {
        beforeEach(async () => {
          await artifact.start();
          await artifact.discard();
        });

        it('should wait till .discard() ends and .start() again', async () => {
          await artifact.start(1, 2, 3, 4);
          expect(artifact.doStart).toHaveBeenCalledTimes(2);
          // TODO: assert the correct execution order
        });
      });

      describe('if .discard() has been rejected before', () => {
        let err;

        beforeEach(async () => {
          artifact.doDiscard.mockReturnValue(Promise.reject(err = new Error()));
          await artifact.start();
          await artifact.discard().catch(_.noop);
        });

        it('should reject as well', async () => {
          await expect(artifact.start()).rejects.toThrow(err);
        });
      });
    });

    describe('.stop()', () => {
      describe('if .start() has never been called', () => {
        it('should resolve as an empty stub', async () => {
          await artifact.stop();
        });

        it('should not call protected .doStop()', async () => {
          await artifact.stop();
          expect(artifact.doStop).not.toHaveBeenCalled();
        });

        it('should not call protected .doStart()', async () => {
          await artifact.stop();
          expect(artifact.doStart).not.toHaveBeenCalled();
        });
      });

      describe('if .start() has been resolved', () => {
        beforeEach(async () => artifact.start());

        it('should call protected .doStop()', async () => {
          await artifact.stop(9, 1, 1);
          expect(artifact.doStop).toHaveBeenCalledWith(9, 1, 1);
        });

        it('should keep returning the same promise on consequent calls', async () => {
          expect(artifact.stop()).toBe(artifact.stop());
          await artifact.stop();
          expect(artifact.doStop).toHaveBeenCalledTimes(1);
        });

        it('should reject if .doStop() rejects', async () => {
          const err = new Error();
          artifact.doStop.mockReturnValue(Promise.reject(err));

          await expect(artifact.stop()).rejects.toThrow(err);
        });
      });

      describe('if .start() has been rejected', () => {
        let error;

        beforeEach(async () => {
          error = new Error();

          artifact.doStart.mockReturnValue(Promise.reject(error));
          await artifact.start().catch(_.noop);
        });

        it('should reject the same error too', async () => {
          await expect(artifact.stop()).rejects.toThrow(error);
        });

        it('should not call protected .doStop()', async () => {
          await artifact.stop().catch(_.noop);
          expect(artifact.doStop).not.toHaveBeenCalled();
        });
      });
    });

    describe('.discard()', () => {
      describe('if .start() has never been called', () => {
        it('should not throw an error', async () => {
          await artifact.discard();
        });

        it('should not call protected .doStart()', async () => {
          await artifact.discard();
          expect(artifact.doStart).not.toHaveBeenCalled();
        });

        it('should not call protected .doStop()', async () => {
          await artifact.discard();
          expect(artifact.doStop).not.toHaveBeenCalled();
        });

        it('should not call protected .doDiscard()', async () => {
          await artifact.discard();
          expect(artifact.doDiscard).not.toHaveBeenCalled();
        });

        it('should resolve .stop() with the same stub promise', async () => {
          expect(artifact.discard()).toBe(artifact.stop());
        });
      });

      describe('if .start() has been resolved', () => {
        beforeEach(async () => artifact.start());

        it('should call protected .doStop()', async () => {
          await artifact.discard();
          expect(artifact.doStop).toHaveBeenCalled();
        });

        it('should call protected .doDiscard()', async () => {
          await artifact.discard();
          expect(artifact.doDiscard).toHaveBeenCalled();
        });

        it('should keep returning the same promise on consequent calls', async () => {
          expect(artifact.discard()).toBe(artifact.discard());
          await artifact.discard();

          expect(artifact.doStop).toHaveBeenCalledTimes(1);
          expect(artifact.doDiscard).toHaveBeenCalledTimes(1);
        });
      });

      describe('if .start() has been rejected', () => {
        let error;

        beforeEach(async () => {
          error = new Error();

          artifact.doStart.mockReturnValue(Promise.reject(error));
          await artifact.start().catch(_.noop);
        });

        it('should return the .start() error', async () => {
          await artifact.discard().catch(_.noop);
          await expect(artifact.discard()).rejects.toThrow(error);
        });

        it('should not call protected .doStop()', async () => {
          await artifact.discard().catch(_.noop);
          expect(artifact.doStop).not.toHaveBeenCalled();
        });

        it('should not call protected .doDiscard()', async () => {
          await artifact.discard().catch(_.noop);
          expect(artifact.doDiscard).not.toHaveBeenCalled();
        });
      });

      describe('if .stop() has been rejected', () => {
        let error;

        beforeEach(async () => {
          error = new Error();

          artifact.doStop.mockReturnValue(Promise.reject(error));
          await artifact.start();
          await artifact.stop().catch(_.noop);
        });

        it('should return the .stop() error', async () => {
          await artifact.discard().catch(_.noop);
          await expect(artifact.discard()).rejects.toThrow(error);
        });

        it('should not call protected .doDiscard()', async () => {
          await artifact.discard().catch(_.noop);
          expect(artifact.doDiscard).not.toHaveBeenCalled();
        });
      });

      describe('if .save() has been called', () => {
        beforeEach(async () => {
          await artifact.start();
          await artifact.stop();
          await artifact.save('artifactPath');
        });

        it('should not call protected .doDiscard()', async () => {
          await artifact.discard();
          expect(artifact.doDiscard).not.toHaveBeenCalled();
        });

        it('should return .save() promise', () => {
          expect(artifact.discard()).toBe(artifact.save());
        });
      });
    });

    describe('.save(artifactPath)', () => {
      describe('if .start() has never been called', () => {
        beforeEach(async () => artifact.save('artifactPath'));

        it('should not call protected .doStart()', async () => {
          expect(artifact.doStart).not.toHaveBeenCalled();
        });

        it('should not call protected .doStop()', async () => {
          expect(artifact.doStop).not.toHaveBeenCalled();
        });

        it('should not call protected .doDiscard()', async () => {
          expect(artifact.doDiscard).not.toHaveBeenCalled();
        });

        it('should return the same promise on next calls', async () => {
          expect(artifact.save('artifactPath')).toBe(artifact.stop());
        });

        it('should resolve .stop() with the same stub promise', async () => {
          expect(artifact.save()).toBe(artifact.stop());
        });
      });

      describe('if .discard() has been called before', () => {
        beforeEach(async () => artifact.discard());

        it('should return discard promise instead', async () => {
          expect(artifact.save('artifactPath')).toBe(artifact.discard());
        });

        it('should not call protected .doSave(artifactPath)', async () => {
          await artifact.save('artifactPath');
          expect(artifact.doSave).not.toHaveBeenCalled();
        });
      });

      describe('if .start() has been called', () => {
        beforeEach(async () => artifact.start());

        it('should call protected .doSave(artifactPath)', async () => {
          await artifact.save('artifactPath');
          expect(artifact.doSave).toHaveBeenCalledWith('artifactPath');
        });

        it('should call protected .doStop()', async () => {
          await artifact.save('artifactPath');
          expect(artifact.doStop).toHaveBeenCalled();
        });
      });

      describe('if .start() has been rejected', () => {
        let error;

        beforeEach(async () => {
          error = new Error();
          artifact.doStart.mockReturnValue(Promise.reject(error));
          await artifact.start().catch(_.noop);
        });

        it('should return the same error', async () => {
          await expect(artifact.save('artifactPath')).rejects.toThrow(error);
        });

        it('should not call protected .doStop()', async () => {
          await artifact.save('artifactPath').catch(_.noop);
          expect(artifact.doStop).not.toHaveBeenCalled();
        });

        it('should not call protected .doSave()', async () => {
          await artifact.save('artifactPath').catch(_.noop);
          expect(artifact.doSave).not.toHaveBeenCalled();
        });
      });

      describe('if .stop() has been rejected', () => {
        let error;

        beforeEach(async () => {
          error = new Error();
          artifact.doStop.mockReturnValue(Promise.reject(error));
          await artifact.start();
          await artifact.stop().catch(_.noop);
        });

        it('should return the same error', async () => {
          await expect(artifact.save('artifactPath')).rejects.toThrow(error);
        });

        it('should not call protected .doStop()', async () => {
          artifact.doStop.mockClear();
          await artifact.save('artifactPath').catch(_.noop);
          expect(artifact.doStop).not.toHaveBeenCalled();
        });

        it('should not call protected .doSave()', async () => {
          await artifact.save('artifactPath').catch(_.noop);
          expect(artifact.doSave).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('methods as constructor arg', () => {
    let artifact;

    it('should replace protected .name with arg.name', () => {
      artifact = new Artifact({ name: 'SomeName' });
      expect(artifact.name).toBe('SomeName');
    });

    it('should replace protected .doStart() with arg.start()', async () => {
      const start = jest.fn();
      artifact = new Artifact({ start });

      await artifact.start(1, 2, 3);
      expect(start).toHaveBeenCalledWith(1, 2, 3);
    });

    it('should replace protected .doStop() with arg.stop()', async () => {
      const stop = jest.fn();
      artifact = new Artifact({ stop });

      await artifact.start();
      await artifact.stop(3, 4, 5);
      expect(stop).toHaveBeenCalledWith(3, 4, 5);
    });

    it('should replace protected .doSave() with arg.save()', async () => {
      const save = jest.fn();
      artifact = new Artifact({ save });

      await artifact.start();
      await artifact.save('path', 100);
      expect(save).toHaveBeenCalledWith('path', 100);
    });

    it('should replace protected .doDiscard() with arg.discard()', async () => {
      const discard = jest.fn();
      artifact = new Artifact({ discard });

      await artifact.start();
      await artifact.discard(200);
      expect(discard).toHaveBeenCalledWith(200);
    });
  });

  describe('static helper methods', () => {
    describe('.moveTemporaryFile', () => {
      let source = '', destination = '';

      beforeEach(() => {
        source = tempfile('.tmp');
      });

      afterEach(async () => {
        await fs.remove(source);
        await fs.remove(destination);
      });

      it('should move file from source to destination and log that', async () => {
        await fs.writeFile(source, 'dummy');
        await Artifact.moveTemporaryFile(logger, source, destination = tempfile('.dest'));

        expect(await fs.exists(destination)).toBe(true);
        expect(logger.debug).toHaveBeenCalledWith({ event: 'MOVE_FILE' }, expect.any(String));
      });

      it('should log error if source file does not exist', async () => {
        await Artifact.moveTemporaryFile(logger, source, destination = tempfile('.dest'));
        expect(await fs.exists(destination)).toBe(false);
        expect(logger.error).toHaveBeenCalledWith({ event: 'MOVE_FILE_ERROR' }, expect.any(String));
      });
    });
  });
});
