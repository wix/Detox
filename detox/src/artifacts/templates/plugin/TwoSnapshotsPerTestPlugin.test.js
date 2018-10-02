jest.mock('../../../utils/logger.js');
const TwoSnapshotsPerTestPlugin = require('./TwoSnapshotsPerTestPlugin');
const ArtifactsApi = require('./__mocks__/ArtifactsApi.mock');
const testSummaries = require('./__mocks__/testSummaries.mock');

describe('TwoSnapshotsPerTestPlugin', () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = new ArtifactsApi();
    plugin = new FakeTwoSnapshotsPerTestPlugin({ api });
  });

  describe('when disabled', () => {
    beforeEach(() => plugin.disable());

    describe('onBeforeEach', () => {
      beforeEach(async () => plugin.onBeforeEach(testSummaries.running()));

      it('should not create artifact onBeforeEach', async () =>
        expect(plugin.createTestArtifact).not.toHaveBeenCalled());
    });

    describe('when configured to keep artifacts', function() {
      beforeEach(() => plugin.configureToKeepArtifacts(true));

      describe('onAfterEach', () => {
        beforeEach(async () => plugin.onAfterEach(testSummaries.passed()));

        it('should not do create artifacts', async () =>
          expect(plugin.createTestArtifact).not.toHaveBeenCalled());

        it('should not do request idle callbacks', async () =>
          expect(api.requestIdleCallback).not.toHaveBeenCalled());
      });
    });

    describe('when configured to keep artifacts', function() {
      beforeEach(() => plugin.configureToKeepArtifacts(false));

      describe('onAfterEach', () => {
        beforeEach(async () => plugin.onAfterEach(testSummaries.passed()));

        it('should not do create artifacts', async () =>
          expect(plugin.createTestArtifact).not.toHaveBeenCalled());

        it('should not do request idle callbacks', async () =>
          expect(api.requestIdleCallback).not.toHaveBeenCalled());
      });
    });
  });

  describe('when onBeforeEach called', function() {
    beforeEach(async () => {
      await plugin.onBeforeEach(testSummaries.running());
    });

    it('should create test artifact', () => {
      expect(plugin.createTestArtifact).toHaveBeenCalledTimes(1);
    });

    it('should start and stop recording in the artifact', () => {
      const [createdArtifact] = plugin.createdArtifacts;
      expect(createdArtifact.start).toHaveBeenCalledTimes(1);
      expect(createdArtifact.stop).toHaveBeenCalledTimes(1);
    });

    it('should put the artifact under tracking', () => {
      const [createdArtifact] = plugin.createdArtifacts;
      expect(api.trackArtifact).toHaveBeenCalledWith(createdArtifact);
    });
  });

  describe('when the plugin should keep a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(true));

    describe('when onBeforeEach and onAfterEach are called', () => {
      beforeEach(async () => {
        await plugin.onBeforeEach(testSummaries.running());
        await plugin.onAfterEach(testSummaries.passed());
      });

      it('should create the second test artifact', () => {
        expect(plugin.createTestArtifact).toHaveBeenCalledTimes(2);
      });

      it('should start and stop the second test artifact', () => {
        const [, secondArtifact] = plugin.createdArtifacts;
        expect(secondArtifact.start).toHaveBeenCalledTimes(1);
        expect(secondArtifact.stop).toHaveBeenCalledTimes(1);
      });

      it('should put the second test artifact under tracking', () => {
        const [, secondArtifact] = plugin.createdArtifacts;
        expect(api.trackArtifact).toHaveBeenCalledWith(secondArtifact);
      });

      it('should schedule two saving operations and specify itself as an initiator', () => {
        expect(api.requestIdleCallback).toHaveBeenCalledTimes(2);
        expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
        expect(api.requestIdleCallback.mock.calls[1]).toEqual([expect.any(Function)]);
      });

      it('should schedule to save and untrack the first artifact', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[0];

        expect(plugin.createdArtifacts[0].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.createdArtifacts[0].save).toBeCalledWith('test/0.png');
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[0]);
      });

      it('should ultimately save and untrack the second artifact', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[1];

        expect(plugin.createdArtifacts[1].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.createdArtifacts[1].save).toBeCalledWith('test/1.png');
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[1]);
      });
    });
  });

  describe('when the plugin should not keep a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(false));

    describe('when onBeforeEach and onAfterEach are called', () => {
      beforeEach(async () => {
        await plugin.onBeforeEach(testSummaries.running());
        await plugin.onAfterEach(testSummaries.passed());
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

        expect(plugin.createdArtifacts[0].discard).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await discardRequest();

        expect(plugin.createdArtifacts[0].discard).toHaveBeenCalledTimes(1);
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[0]);
      });
    });
  });
});

class FakeTwoSnapshotsPerTestPlugin extends TwoSnapshotsPerTestPlugin {
  constructor(...args) {
    super(...args);
    this.enabled = true;
    this.createTestArtifact = jest.fn(this.createTestArtifact.bind(this));
    this.createdArtifacts = [];
  }

  configureToKeepArtifacts(shouldKeep) {
    this.shouldKeepArtifactOfTest = () => shouldKeep;
  }

  preparePathForSnapshot(testSummary, index) {
    super.preparePathForSnapshot(testSummary, index);
    return `${testSummary.title}/${index}.png`;
  }

  createTestArtifact() {
    super.createTestArtifact();

    const artifact = {
      start: jest.fn(),
      stop: jest.fn(),
      save: jest.fn(),
      discard: jest.fn(),
    };

    this.createdArtifacts.push(artifact);
    return artifact;
  }
}
