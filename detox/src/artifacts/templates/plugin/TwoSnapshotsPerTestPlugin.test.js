jest.mock('../../../utils/logger.js');
const TwoSnapshotsPerTestPlugin = require('./TwoSnapshotsPerTestPlugin');
const ArtifactMock = require('../artifact/__mocks__/ArtifactMock');
const ArtifactsApi = require('./__mocks__/ArtifactsApi.mock');
const testSummaries = require('./__mocks__/testSummaries.mock');

describe('TwoSnapshotsPerTestPlugin', () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = new ArtifactsApi({
      config: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
      },
    });
    plugin = new FakeTwoSnapshotsPerTestPlugin({ api });
  });

  describe('when disabled', () => {
    beforeEach(() => plugin.disable());

    describe('onTestStart', () => {
      beforeEach(async () => plugin.onTestStart(testSummaries.running()));

      it('should not create artifact onTestStart', async () =>
        expect(plugin.createTestArtifact).not.toHaveBeenCalled());
    });

    describe('when configured to keep artifacts', function() {
      beforeEach(() => plugin.configureToKeepArtifacts(true));

      describe('onTestDone', () => {
        beforeEach(async () => plugin.onTestDone(testSummaries.passed()));

        it('should not do create artifacts', async () =>
          expect(plugin.createTestArtifact).not.toHaveBeenCalled());

        it('should not do request idle callbacks', async () =>
          expect(api.requestIdleCallback).not.toHaveBeenCalled());
      });
    });

    describe('when configured to keep artifacts', function() {
      beforeEach(() => plugin.configureToKeepArtifacts(false));

      describe('onTestDone', () => {
        beforeEach(async () => plugin.onTestDone(testSummaries.passed()));

        it('should not do create artifacts', async () =>
          expect(plugin.createTestArtifact).not.toHaveBeenCalled());

        it('should not do request idle callbacks', async () =>
          expect(api.requestIdleCallback).not.toHaveBeenCalled());
      });
    });
  });

  describe('when onTestStart called', function() {
    beforeEach(async () => {
      await plugin.onTestStart(testSummaries.running());
    });

    it('should create test artifact', () => {
      expect(plugin.createTestArtifact).toHaveBeenCalledTimes(1);
    });

    it('should start and stop recording in the artifact', () => {
      expect(plugin.snapshots.fromTest['beforeEach'].start).toHaveBeenCalledTimes(1);
      expect(plugin.snapshots.fromTest['beforeEach'].stop).toHaveBeenCalledTimes(1);
    });

    it('should put the artifact under tracking', () => {
      expect(api.trackArtifact).toHaveBeenCalledWith(plugin.snapshots.fromTest['beforeEach']);
    });
  });

  describe('onCreateExternalArtifact', () => {
    it('should throw error if { artifact } is not defined', async () => {
      await expect(plugin.onCreateExternalArtifact({ name: 'Hello'})).rejects.toThrowError();
    });

    it('should set snapshot in key-value map and track it', async () => {
      const artifact = new ArtifactMock('test');
      await plugin.onCreateExternalArtifact({ name: 'hello', artifact });

      expect(plugin.snapshots.fromSession['hello']).toBe(artifact);
      expect(api.trackArtifact).toHaveBeenCalledWith(artifact);
    });
  });

  describe('when the plugin should keep a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(true));

    describe('when onTestStart and onTestDone are called', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.passed());
      });

      it('should create the second test artifact', () => {
        expect(plugin.createTestArtifact).toHaveBeenCalledTimes(2);
      });

      it('should start and stop the second test artifact', () => {
        expect(plugin.snapshots.fromTest['afterEach'].start).toHaveBeenCalledTimes(1);
        expect(plugin.snapshots.fromTest['afterEach'].stop).toHaveBeenCalledTimes(1);
      });

      it('should put the second test artifact under tracking', () => {
        expect(api.trackArtifact).toHaveBeenCalledWith(plugin.snapshots.fromTest['afterEach']);
      });

      it('should schedule two saving operations and specify itself as an initiator', () => {
        expect(api.requestIdleCallback).toHaveBeenCalledTimes(2);
        expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
        expect(api.requestIdleCallback.mock.calls[1]).toEqual([expect.any(Function)]);
      });

      it('should schedule to save and untrack the first artifact', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[0];

        expect(plugin.snapshots.fromTest['beforeEach'].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.snapshots.fromTest['beforeEach'].save).toBeCalledWith('test/beforeEach.png');
        expect(api.untrackArtifact).toBeCalledWith(plugin.snapshots.fromTest['beforeEach']);
      });

      it('should ultimately save and untrack the second artifact', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[1];

        expect(plugin.snapshots.fromTest['afterEach'].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.snapshots.fromTest['afterEach'].save).toBeCalledWith('test/afterEach.png');
        expect(api.untrackArtifact).toBeCalledWith(plugin.snapshots.fromTest['afterEach']);
      });
    });

    describe('when an external snapshot is created in the midst of a test', function() {
      let artifact;

      beforeEach(async () => {
        artifact = new ArtifactMock('screenshot');

        await plugin.onTestStart(testSummaries.running());
        await plugin.onCreateExternalArtifact({
          artifact,
          name: 'final_name',
        });
        await plugin.onTestDone(testSummaries.passed());
      });

      it('should be saved using the suggested name and untracked', async () => {
        expect(artifact.save).not.toBeCalledWith('test/final_name.png');
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await Promise.all(api.requestIdleCallback.mock.calls.map(s => s[0]()));

        expect(artifact.save).toBeCalledWith('test/final_name.png');
        expect(api.untrackArtifact).toHaveBeenCalled();
      });
    });

    describe('when an external snapshot is created before beforeEach', function() {
      let artifact;

      beforeEach(async () => {
        artifact = new ArtifactMock('screenshot');

        await plugin.onCreateExternalArtifact({
          artifact,
          name: 'final_name',
        });
        await plugin.onTestStart(testSummaries.running());
      });

      it('should be saved using the suggested name and untracked', async () => {
        expect(artifact.save).not.toBeCalledWith('final_name.png');
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await Promise.all(api.requestIdleCallback.mock.calls.map(s => s[0]()));

        expect(artifact.save).toBeCalledWith('final_name.png');
        expect(api.untrackArtifact).toHaveBeenCalled();
      });
    });

    describe('when an external snapshot is created before afterAll', function() {
      let artifact;

      beforeEach(async () => {
        artifact = new ArtifactMock('screenshot');

        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.passed());
        await plugin.onCreateExternalArtifact({
          artifact,
          name: 'final_name',
        });
        await plugin.onAfterAll();
      });

      it('should be saved using the suggested name and untracked', async () => {
        expect(artifact.save).not.toBeCalledWith('final_name.png');
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await Promise.all(api.requestIdleCallback.mock.calls.map(s => s[0]()));

        expect(artifact.save).toBeCalledWith('final_name.png');
        expect(api.untrackArtifact).toHaveBeenCalled();
      });
    });
  });

  describe('when the plugin should not keep a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(false));

    describe('when onTestStart and onTestDone are called', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.passed());
      });

      it('should not create the second test artifact', () => {
        expect(plugin.createTestArtifact).toHaveBeenCalledTimes(1);
      });

      it('should schedule a discard operation for the first artifact and specify itself as an initiator', () => {
        expect(api.requestIdleCallback).toHaveBeenCalledTimes(1);
        expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
      });

      it('should ultimately discard and untrack the first artifact', async () => {
        const [discardRequest] = api.requestIdleCallback.mock.calls[0];

        expect(plugin.snapshots.fromTest['beforeEach'].discard).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await discardRequest();

        expect(plugin.snapshots.fromTest['beforeEach'].discard).toHaveBeenCalledTimes(1);
        expect(api.untrackArtifact).toBeCalledWith(plugin.snapshots.fromTest['beforeEach']);
      });
    });

    describe('when an external snapshot is created in the midst of a test', function() {
      let artifact;

      beforeEach(async () => {
        artifact = new ArtifactMock('screenshot');

        await plugin.onTestStart(testSummaries.running());
        await plugin.onCreateExternalArtifact({
          artifact,
          name: 'final_name',
        });
        await plugin.onTestDone(testSummaries.passed());
      });

      it('should be discarded and untracked', async () => {
        expect(artifact.discard).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await Promise.all(api.requestIdleCallback.mock.calls.map(s => s[0]()));

        expect(artifact.discard).toHaveBeenCalled();
        expect(api.untrackArtifact).toHaveBeenCalledWith(artifact);
      });
    });
  });
});

class FakeTwoSnapshotsPerTestPlugin extends TwoSnapshotsPerTestPlugin {
  constructor({ api }) {
    super({ api });
    this.createTestArtifact = jest.fn(this.createTestArtifact.bind(this));

    const nonDeletable = { deleteProperty: () => true };
    this.snapshots.fromSession = new Proxy(this.snapshots.fromSession, nonDeletable);
    this.snapshots.fromTest = new Proxy(this.snapshots.fromTest, nonDeletable);
  }

  configureToKeepArtifacts(shouldKeep) {
    this.shouldKeepArtifactOfTest = this.shouldKeepArtifactOfSession = () => shouldKeep;
  }

  createTestArtifact() {
    super.createTestArtifact();
    return new ArtifactMock('test');
  }

  preparePathForSnapshot(testSummary, snapshotName) {
    super.preparePathForSnapshot(testSummary, snapshotName);

    if (testSummary) {
      return `${testSummary.title}/${snapshotName}.png`;
    } else {
      return `${snapshotName}.png`;
    }
  }
}
