const _ = require('lodash');
const Artifact = require('./Artifact');

describe.skip(Artifact, () => {
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
    it('should call protected .doStart() method', async () => {
      await artifact.start();
      expect(artifact.doStart).toHaveBeenCalled();
    });

    it('should return the same promise on consequent calls', async () => {
      expect(artifact.start()).toBe(artifact.start());
      await artifact.start();

      expect(artifact.doStart).toHaveBeenCalledTimes(1);
    });

    it('should reject if the protected .doStart() rejects', async () => {
      const err = new Error();

      artifact.doStart.mockReturnValue(Promise.reject(err));
      await expect(artifact.start()).rejects.toThrow(err);
    });
  });

  describe('.stop()', () => {
    describe('if .start() had never been called', () => {
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

    describe('if .start() had been resolved', () => {
      beforeEach(async () => artifact.start());

      it('should call protected .doStop()', async () => {
        await artifact.stop();
        expect(artifact.doStop).toHaveBeenCalled();
      });

      it('should keep returning the same promise on consequent calls', async () => {
        expect(artifact.stop()).toBe(artifact.stop());
        await artifact.stop();
        expect(artifact.doStop).toHaveBeenCalledTimes(1);
      });

      it('should reject if .doStop() rejects', async () => {
        const err = new Error();
        artifact.doStop.mockReturnValue(Promise.reject(err));

        await artifact.start();
        await expect(artifact.stop()).rejects.toThrow(err);
      });
    });

    describe('if .start() had been rejected', () => {
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
    describe('if .start() had never been called', () => {
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

      it('should resolve .start() with the same stub promise', async () => {
        expect(artifact.discard()).toBe(artifact.start());
      });
    });

    describe('if .start() had been resolved', () => {
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

    describe('if .start() had been rejected', () => {
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

    describe('if .stop() had been rejected', () => {
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

    describe('if .save() had been called', () => {
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
    describe('if .start() had never been called', () => {
      it('should throw error', async () => {
        await expect(artifact.save('artifactPath')).rejects.toThrow();
      });

      it('should not call protected .doSave(artifactPath)', async () => {
        await artifact.save('artifactPath').catch(_.noop);
        expect(artifact.doSave).not.toHaveBeenCalled();
      });
    });

    describe('if .discard() had been called before', () => {
      beforeEach(async () => artifact.discard());

      it('should throw error', async () => {
        await expect(artifact.save('artifactPath')).rejects.toThrow();
      });

      it('should not call protected .doSave(artifactPath)', async () => {
        await artifact.save('artifactPath').catch(_.noop);
        expect(artifact.doSave).not.toHaveBeenCalled();
      });
    });

    describe('if .start() had been called', () => {
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

    describe('if .start() had been rejected', () => {
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

    describe('if .stop() had been rejected', () => {
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