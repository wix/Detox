jest.mock('npmlog');
const WholeTestRecorderPlugin = require('./WholeTestRecorderPlugin');
const ArtifactsApi = require('./__mocks__/ArtifactsApi.mock');
const testSummaries = require('./__mocks__/testSummaries.mock');

class FakeWholeTestRecorderPlugin extends WholeTestRecorderPlugin {
  constructor(...args) {
    super(...args);

    this.enabled = true;
    this.createTestArtifact = jest.fn(this.createTestArtifact.bind(this));
    this.createdArtifacts = [];
  }

  configureToKeepArtifacts(shouldKeep) {
    this.shouldKeepArtifactOfTest = () => shouldKeep;
  }

  preparePathForTestArtifact(testSummary) {
    super.preparePathForSnapshot(testSummary);
    return `${testSummary.title}/fakeArtifact`;
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

describe('WholeTestRecorderPlugin', () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = new ArtifactsApi();
    plugin = new FakeWholeTestRecorderPlugin({ api });
  });

  describe('when disabled', () => {
    beforeEach(() => plugin.disable());

    describe('onBeforeEach', () => {
      beforeEach(async () => plugin.onBeforeEach(testSummaries.running()));

      it('should not create artifact onBeforeEach', async () =>
        expect(plugin.createTestArtifact).not.toHaveBeenCalled());
    });

    describe('onAfterEach', () => {
      beforeEach(async () => plugin.onAfterEach(testSummaries.passed()));

      it('should not do create artifacts', async () =>
        expect(plugin.createTestArtifact).not.toHaveBeenCalled());

      it('should not do request idle callbacks', async () =>
        expect(api.requestIdleCallback).not.toHaveBeenCalled());
    });
  });

  describe('onBeforeEach', () => {
    beforeEach(async () => plugin.onBeforeEach(testSummaries.running()));

    it('should create artifact', async () => {
      expect(plugin.createTestArtifact).toHaveBeenCalled();
    });

    it('should start recording artifact', async () => {
      expect(plugin.createdArtifacts[0].start).toHaveBeenCalledTimes(1);
    });

    it('should not stop recording artifact', async () => {
      expect(plugin.createdArtifacts[0].stop).not.toHaveBeenCalled();
    });

    it('should put the artifact under tracking', async () => {
      expect(api.trackArtifact).toHaveBeenCalledWith(plugin.createdArtifacts[0]);
    });
  });

  describe('when the plugin should keep a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(true));

    describe('onAfterEach', () => {
      beforeEach(async () => {
        await plugin.onBeforeEach(testSummaries.running());
        await plugin.onAfterEach(testSummaries.failed());
      });

      it('should stop artifact recording', async () => {
        expect(plugin.createdArtifacts[0].stop).toHaveBeenCalled();
      });

      // TODO: add test about idle callback
    });
  });

  describe('when the plugin should discard a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(false));

    describe('onAfterEach', () => {
      beforeEach(async () => {
        await plugin.onBeforeEach(testSummaries.running());
        await plugin.onAfterEach(testSummaries.failed());
      });

      it('should stop artifact recording', async () => {
        expect(plugin.createdArtifacts[0].stop).toHaveBeenCalled();
      });

      // TODO: add test about idle callback
    });
  });
});
