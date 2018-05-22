const _ = require('lodash');
const SnapshotArtifact = require('./SnapshotArtifact');

describe(SnapshotArtifact, () => {
  let artifact;

  class SnapshotArtifactTest extends SnapshotArtifact {
    constructor() {
      super();

      this.doCreate = jest.fn().mockImplementation(() => super.doCreate());
      this.doSave = jest.fn().mockImplementation(() => super.doSave());
      this.doDiscard = jest.fn().mockImplementation(() => super.doDiscard());
    }
  }

  beforeEach(() => {
    artifact = new SnapshotArtifactTest();
  });

  it('should pass regular save flow', async () => {
    expect(artifact.doCreate).not.toHaveBeenCalled();
    await artifact.create();
    expect(artifact.doCreate).toHaveBeenCalled();

    expect(artifact.doSave).not.toHaveBeenCalled();
    await artifact.save('path/to/artifact');
    expect(artifact.doSave).toHaveBeenCalledWith('path/to/artifact');
  });

  it('should pass regular discard flow', async () => {
    expect(artifact.doCreate).not.toHaveBeenCalled();
    await artifact.create();
    expect(artifact.doCreate).toHaveBeenCalled();

    expect(artifact.doDiscard).not.toHaveBeenCalled();
    await artifact.discard();
    expect(artifact.doDiscard).toHaveBeenCalled();
  });

  describe('.create()', () => {
    it('should call .doCreate() only once', async () => {
      expect(artifact.create()).toBe(artifact.create());
      await artifact.create();

      expect(artifact.doCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('.save(artifactPath)', () => {
    describe('if .create() had never been called', () => {
      it('should throw an error', async () => {
        await expect(artifact.save('artifactsPath')).rejects.toThrow();
      });
    });

    describe('if .discard() had been called', () => {
      beforeEach(async () => artifact.discard());

      it('should throw an error', async () => {
        await expect(artifact.save('artifactsPath')).rejects.toThrow();
      });
    });

    describe('if .create() had been resolved', () => {
      beforeEach(async () => artifact.create());

      it('should call .doSave(artifactPath) only once', async () => {
        await expect(artifact.save('artifactPath'));
        await expect(artifact.save(''));

        expect(artifact.doSave).toHaveBeenCalledWith('artifactPath');
        expect(artifact.doSave).toHaveBeenCalledTimes(1);
      });
    });

    describe('if .create() had been rejected', () => {
      let error;

      beforeEach(async () => {
        error = new Error();
        artifact.doCreate.mockReturnValue(Promise.reject(error));

        await artifact.create().catch(_.noop);
      });

      it('should return .create() error', async () => {
        await expect(artifact.save()).rejects.toThrow(error);
      });
    });
  });

  describe('.discard()', () => {
    describe('if .create() had never been called', () => {
      it('should not call .doDiscard()', async () => {
        await artifact.discard();
        expect(artifact.doDiscard).not.toHaveBeenCalled();
      });

      it('should not call .doCreate(), instead make it stub', async () => {
        await artifact.discard();

        expect(artifact.discard()).toBe(artifact.create());
        expect(artifact.doCreate).not.toHaveBeenCalled();
      });
    });

    describe('if .create() had been resolved', () => {
      beforeEach(async () => artifact.create());

      it('should call .doSave(artifactPath) only once', async () => {
        await expect(artifact.save('artifactPath'));
        await expect(artifact.save(''));

        expect(artifact.doSave).toHaveBeenCalledWith('artifactPath');
        expect(artifact.doSave).toHaveBeenCalledTimes(1);
      });
    });

    describe('if .create() had been rejected', () => {
      let error;

      beforeEach(async () => {
        error = new Error();
        artifact.doCreate.mockReturnValue(Promise.reject(error));

        await artifact.create().catch(_.noop);
      });

      it('should return .create() error', async () => {
        await expect(artifact.discard()).rejects.toThrow(error);
      });
    });
  });
});