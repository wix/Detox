// @ts-nocheck
jest.mock('../../../utils/logger.js');
const testSummaries = require('../../__mocks__/testSummaries.mock');
const ArtifactMock = require('../artifact/__mocks__/ArtifactMock');

const StartupAndTestRecorderPlugin = require('./StartupAndTestRecorderPlugin');
const ArtifactsApi = require('./__mocks__/ArtifactsApi.mock');

describe('StartupAndTestRecorderPlugin', () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = new ArtifactsApi({
      config: {
        enabled: false,
        keepOnlyFailedTestsArtifacts: false,
      },
    });
    plugin = new FakeStartupAndTestRecorderPlugin({ api });
  });

  describe('when disabled', () => {
    beforeEach(() => {
      plugin.disable();
    });

    describe('onReadyToRecord', () => {
      beforeEach(async () => {
        await plugin.onReadyToRecord();
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    describe('onTestStart', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    describe('onTestDone', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.failed());
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    describe('onBeforeCleanup', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
        await plugin.onTestDone(testSummaries.failed());
        await plugin.onBeforeCleanup();
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    async function expectThatNothingActuallyHappens() {
      expect(plugin.createStartupRecording).not.toHaveBeenCalled();
      expect(plugin.createTestRecording).not.toHaveBeenCalled();
      expect(plugin.startupRecording).toBe(null);
      expect(plugin.testRecording).toBe(null);
      expect(plugin.currentRecording).toBe(null);
    }
  });

  describe('app launch in start-up phase', () => {
    beforeEach(async () => {
      await plugin.onReadyToRecord();
    });

    it('should create start-up recording', () => {
      expect(plugin.createStartupRecording).toHaveBeenCalled();
    });

    it('should set it to protected .startupRecording property', () => {
      expect(plugin.startupRecording).toBe(plugin.createdArtifacts[0]);
    });

    it('should set it to protected .currentRecording property', () => {
      expect(plugin.currentRecording).toBe(plugin.startupRecording);
    });

    it('should put the start-up recording under the tracking system', () => {
      expect(api.trackArtifact).toHaveBeenCalledWith(plugin.startupRecording);
    });
  });

  describe('onTestStart', () => {
    describe('if app was launched before', () => {
      beforeEach(async () => {
        await plugin.onReadyToRecord();
        await plugin.onTestStart(testSummaries.running());
      });

      it('should stop start-up recording', () => {
        expect(plugin.startupRecording.stop).toHaveBeenCalled();
      });

      it('should change protected .current property value', () => {
        expect(plugin.currentRecording).toBe(plugin.createdArtifacts[1]);
      });
    });

    describe('', () => {
      beforeEach(async () => {
        await plugin.onTestStart(testSummaries.running());
      });

      it('should create test recording', () => {
        expect(plugin.createTestRecording).toHaveBeenCalled();
      });

      it('should set to protected .testRecording property', () => {
        expect(plugin.testRecording).toBe(plugin.createdArtifacts[0]);
      });

      it('should set to protected .currentRecording property', () => {
        expect(plugin.currentRecording).toBe(plugin.testRecording);
      });

      it('should start test recording', () => {
        expect(plugin.testRecording.start).toHaveBeenCalled();
      });

      it('should put the test recording under the tracking system', () => {
        expect(api.trackArtifact).toHaveBeenCalledWith(plugin.testRecording);
      });
    });
  });

  describe('onTestDone', () => {
    describe('when plugin is keeping only artifacts from failed tests', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = true;
      });

      describe('and current test passed well', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();
          await plugin.onTestStart(testSummaries.running());
          await plugin.onTestDone(testSummaries.passed());
          await api.emulateRunningAllIdleCallbacks();
        });

        it('should not clean start-up recording property', () => {
          expect(plugin.startupRecording).toBeTruthy();
        });

        it('should not interact with start-up property anyhow', () => {
          expect(plugin.startupRecording.save).not.toHaveBeenCalled();
          expect(plugin.startupRecording.discard).not.toHaveBeenCalled();
        });
      });

      describe('and current test failed', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();
          await plugin.onTestStart(testSummaries.running());
          await plugin.onTestDone(testSummaries.failed());
        });

        itShouldScheduleSavingAndUntrackingOfBothArtifacts();
      });
    });

    describe('when plugin is keeping all artifacts', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = false;
      });

      describe('and test finished anyhow', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();
          await plugin.onTestStart(testSummaries.running());
          await plugin.onTestDone(testSummaries.passed());
        });

        itShouldScheduleSavingAndUntrackingOfBothArtifacts();
      });
    });
  });

  describe('onBeforeCleanup', () => {
    describe('when the plugin is configured to keep all artifacts', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = false;
      });

      describe('when there were no calls to .onTestStart and .onTestDone', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();
          await plugin.onBeforeCleanup();
        });

        it('should schedule saving of the start-up recording', () => {
          expect(api.requestIdleCallback).toHaveBeenCalledTimes(1);
          expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
        });

        it('should reset .startupRecording property to null', async () => {
          expect(plugin.startupRecording).toBe(null);
        });

        it('should eventually save the start-up recording', async () => {
          const [saveStartupRecordingRequest] = api.requestIdleCallback.mock.calls[0];
          const [startupRecording] = plugin.createdArtifacts;

          expect(startupRecording.save).not.toHaveBeenCalled();
          await saveStartupRecordingRequest();
          expect(startupRecording.save).toHaveBeenCalledWith('/tmp/fakeStartupArtifact');
        });

        it('should eventually untrack the start-up recording', async () => {
          const [saveStartupRecordingRequest] = api.requestIdleCallback.mock.calls[0];
          const [startupRecording] = plugin.createdArtifacts;

          expect(api.untrackArtifact).not.toHaveBeenCalledWith(startupRecording);
          await saveStartupRecordingRequest();
          expect(api.untrackArtifact).toHaveBeenCalledWith(startupRecording);
        });
      });

      describe('when there were already calls to .onTestDone', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();
          await plugin.onTestStart(testSummaries.running());
          await plugin.onTestDone(testSummaries.passed());
          api.requestIdleCallback.mockClear();
        });

        it('should already have reset .startupRecording to null', () => {
          expect(plugin.startupRecording).toBe(null);
        });

        it('should not schedule anything extra', async () => {
          expect(api.requestIdleCallback).not.toHaveBeenCalled();
        });
      });
    });

    describe('when the plugin is configured to keep only failing artifacts', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = true;
      });

      describe('when there were no calls to .onTestStart and .onTestDone', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();

          api.requestIdleCallback.mockClear();
          await plugin.onBeforeCleanup();
        });

        itShouldScheduleDiscardingAndUntrackingOfStartupArtifact();
      });

      describe('when all tests were successful', () => {
        beforeEach(async () => {
          await plugin.onReadyToRecord();
          await plugin.onTestStart(testSummaries.running());
          await plugin.onTestDone(testSummaries.passed());

          api.requestIdleCallback.mockClear();
          await plugin.onBeforeCleanup();
        });

        itShouldScheduleDiscardingAndUntrackingOfStartupArtifact();
      });
    });
  });

  function itShouldScheduleSavingAndUntrackingOfBothArtifacts() {
    it('should reset .startupRecording property', () => {
      expect(plugin.startupRecording).toBe(null);
    });

    it('should schedule two operations', () => {
      expect(api.requestIdleCallback).toHaveBeenCalledTimes(2);
      expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
      expect(api.requestIdleCallback.mock.calls[1]).toEqual([expect.any(Function)]);
    });

    it('should schedule saving of the test recording', async () => {
      const [,testRecording] = plugin.createdArtifacts;
      const [saveTestRecordingRequest] = api.requestIdleCallback.mock.calls[0];
      expect(testRecording.save).not.toHaveBeenCalled();

      await saveTestRecordingRequest();
      expect(testRecording.save).toHaveBeenCalledWith('/tmp/test/fakeArtifact');
    });

    it('should schedule saving of the start-up recording', async () => {
      const [startupRecording] = plugin.createdArtifacts;
      const [saveStartupRecordingRequest] = api.requestIdleCallback.mock.calls[1];

      expect(startupRecording.save).not.toHaveBeenCalled();
      await saveStartupRecordingRequest();
      expect(startupRecording.save).toHaveBeenCalledWith('/tmp/fakeStartupArtifact');
    });

    it('should untrack the start-up recording after it is saved', async () => {
      const [startupRecording] = plugin.createdArtifacts;
      const [saveStartupRecordingRequest] = api.requestIdleCallback.mock.calls[1];

      expect(api.untrackArtifact).not.toHaveBeenCalledWith(startupRecording);
      await saveStartupRecordingRequest();
      expect(api.untrackArtifact).toHaveBeenCalledWith(startupRecording);
    });
  }

  function itShouldScheduleDiscardingAndUntrackingOfStartupArtifact() {
    it('should schedule discarding of the start-up recording', () => {
      expect(api.requestIdleCallback).toHaveBeenCalledTimes(1);
      expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
    });

    it('should reset .startupRecording property to null', async () => {
      expect(plugin.startupRecording).toBe(null);
    });

    it('should eventually discard the start-up recording', async () => {
      const [discardRequest] = api.requestIdleCallback.mock.calls[0];
      const [startupRecording] = plugin.createdArtifacts;

      expect(startupRecording.discard).not.toHaveBeenCalled();
      await discardRequest();
      expect(startupRecording.discard).toHaveBeenCalled();
    });

    it('should eventually untrack the start-up recording', async () => {
      const [discardRequest] = api.requestIdleCallback.mock.calls[0];
      const [startupRecording] = plugin.createdArtifacts;

      expect(api.untrackArtifact).not.toHaveBeenCalledWith(startupRecording);
      await discardRequest();
      expect(api.untrackArtifact).toHaveBeenCalledWith(startupRecording);
    });
  }
});

class FakeStartupAndTestRecorderPlugin extends StartupAndTestRecorderPlugin {
  constructor(...args) {
    super(...args);

    this.enabled = true;
    this.createStartupRecording = jest.fn(this.createStartupRecording.bind(this));
    this.createTestRecording = jest.fn(this.createTestRecording.bind(this));
    this.createdArtifacts = [];
  }

  preparePathForStartupArtifact() {
    super.preparePathForStartupArtifact();
    return '/tmp/fakeStartupArtifact';
  }

  preparePathForTestArtifact(testSummary) {
    super.preparePathForTestArtifact(testSummary);
    return `/tmp/${testSummary.title}/fakeArtifact`;
  }

  createStartupRecording() {
    super.createStartupRecording();
    return this._createArtifactMock('startup');
  }

  createTestRecording() {
    super.createTestRecording();
    return this._createArtifactMock('test');
  }

  _createArtifactMock(type) {
    const artifact = new ArtifactMock(type);
    this.createdArtifacts.push(artifact);
    return artifact;
  }
}
