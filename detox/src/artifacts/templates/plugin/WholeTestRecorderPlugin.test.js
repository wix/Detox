// @ts-nocheck
jest.mock('../../../utils/logger.js');
const testSummaries = require('../../__mocks__/testSummaries.mock');

const WholeTestRecorderPlugin = require('./WholeTestRecorderPlugin');
const ArtifactsApi = require('./__mocks__/ArtifactsApi.mock');

describe('WholeTestRecorderPlugin', () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = new ArtifactsApi({
      config: {
        enabled: false,
        keepOnlyFailedTestsArtifacts: false,
      },
    });
    plugin = new FakeWholeTestRecorderPlugin({ api });
  });

  describe('when disabled', () => {
    beforeEach(() => plugin.disable());

    describe('onTestStart', () => {
      beforeEach(async () => plugin.onTestStart(testSummaries.running()));

      it('should not create recording onTestStart', async () =>
        expect(plugin.createTestRecording).not.toHaveBeenCalled());
    });

    describe('onTestDone', () => {
      beforeEach(async () => plugin.onTestDone(testSummaries.passed()));

      it('should not create recording', async () =>
        expect(plugin.createTestRecording).not.toHaveBeenCalled());

      it('should not do request idle callbacks', async () =>
        expect(api.requestIdleCallback).not.toHaveBeenCalled());
    });
  });

  describe('onTestStart', () => {
    beforeEach(async () => plugin.onTestStart(testSummaries.running()));

    it('should create artifact', async () => {
      expect(plugin.createTestRecording).toHaveBeenCalled();
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

    describe('onTestDone', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.failed());
      });

      it('should stop artifact recording', async () => {
        expect(plugin.createdArtifacts[0].stop).toHaveBeenCalled();
      });

      it('should schedule a save operation and specify itself as an initiator', () => {
        expect(api.requestIdleCallback).toHaveBeenCalledTimes(1);
        expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
      });

      it('should ultimately save the artifact and untrack it', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[0];

        expect(plugin.createdArtifacts[0].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.createdArtifacts[0].save).toBeCalledWith('/tmp/test/fakeArtifact');
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[0]);
      });
    });
  });

  describe('when the plugin should discard a test artifact', () => {
    beforeEach(() => plugin.configureToKeepArtifacts(false));

    describe('onTestDone', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.failed());
      });

      it('should stop artifact recording', async () => {
        expect(plugin.createdArtifacts[0].stop).toHaveBeenCalled();
      });

      it('should schedule a discard operation and specify itself as an initiator', () => {
        expect(api.requestIdleCallback).toHaveBeenCalledTimes(1);
        expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
      });

      it('should ultimately discard the artifact and untrack it', async () => {
        const [discardRequest] = api.requestIdleCallback.mock.calls[0];

        expect(plugin.createdArtifacts[0].discard).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await discardRequest();

        expect(plugin.createdArtifacts[0].discard).toBeCalled();
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[0]);
      });
    });
  });
});

class FakeWholeTestRecorderPlugin extends WholeTestRecorderPlugin {
  constructor(...args) {
    super(...args);

    this.enabled = true;
    this.createTestRecording = jest.fn(this.createTestRecording.bind(this));
    this.createdArtifacts = [];
  }

  configureToKeepArtifacts(shouldKeep) {
    this.shouldKeepArtifactOfTest = () => shouldKeep;
  }

  preparePathForTestArtifact(testSummary) {
    super.preparePathForTestArtifact(testSummary);
    return `/tmp/${testSummary.title}/fakeArtifact`;
  }

  createTestRecording() {
    super.createTestRecording();

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
