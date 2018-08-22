jest.mock('../../../utils/logger.js');
const StartupAndTestRecorderPlugin = require('./StartupAndTestRecorderPlugin');
const ArtifactsApi = require('./__mocks__/ArtifactsApi.mock');
const testSummaries = require('./__mocks__/testSummaries.mock');

describe('StartupAndTestRecorderPlugin', () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = new ArtifactsApi();
    plugin = new FakeStartupAndTestRecorderPlugin({ api });
  });

  describe('when disabled', () => {
    beforeEach(() => {
      plugin.disable();
    });

    describe('onBeforeAll', () => {
      beforeEach(async () => {
        await plugin.onBeforeAll();
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    describe('onBeforeEach', () => {
      beforeEach(async () => {
        await plugin.onBeforeAll();
        await plugin.onBeforeEach(testSummaries.running());
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    describe('onAfterEach', () => {
      beforeEach(async () => {
        await plugin.onBeforeAll();
        await plugin.onBeforeEach(testSummaries.running());
        await plugin.onAfterEach(testSummaries.failed());
      });

      it('should end correctly, but do nothing', expectThatNothingActuallyHappens);
    });

    describe('onAfterAll', () => {
      beforeEach(async () => {
        await plugin.onBeforeAll();
        await plugin.onBeforeEach(testSummaries.running());
        await plugin.onAfterEach(testSummaries.failed());
        await plugin.onAfterAll();
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

  describe('onBeforeAll', () => {
    beforeEach(async () => {
      await plugin.onBeforeAll();
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

    it('should start the start-up recording', () => {
      expect(plugin.startupRecording.start).toHaveBeenCalled();
    });

    it('should put the start-up recording under the tracking system', () => {
      expect(api.trackArtifact).toHaveBeenCalledWith(plugin.startupRecording);
    });
  });

  describe('onBeforeEach', () => {
    beforeEach(async () => {
      await plugin.onBeforeAll();
      await plugin.onBeforeEach(testSummaries.running());
    });

    it('should stop start-up recording', () => {
      expect(plugin.startupRecording.stop).toHaveBeenCalled();
    });

    it('should create test recording', () => {
      expect(plugin.createTestRecording).toHaveBeenCalled();
    });

    it('should set to protected .testRecording propertty', () => {
      expect(plugin.testRecording).toBe(plugin.createdArtifacts[1]);
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

  describe('onAfterEach', () => {
    describe('when plugin is keeping only artifacts from failed tests', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = true;
      });

      describe('and current test passed well', () => {
        beforeEach(async () => {
          await plugin.onBeforeAll();
          await plugin.onBeforeEach(testSummaries.running());
          await plugin.onAfterEach(testSummaries.passed());
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
          await plugin.onBeforeAll();
          await plugin.onBeforeEach(testSummaries.running());
          await plugin.onAfterEach(testSummaries.failed());
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
          await plugin.onBeforeAll();
          await plugin.onBeforeEach(testSummaries.running());
          await plugin.onAfterEach(testSummaries.passed());
        });

        itShouldScheduleSavingAndUntrackingOfBothArtifacts();
      });
    });
  });

  describe('onAfterAll', () => {
    describe('when the plugin is configured to keep all artifacts', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = false;
      });

      describe('when there were no calls to .onBeforeEach and .onAfterEach', () => {
        beforeEach(async () => {
          await plugin.onBeforeAll();
          await plugin.onAfterAll();
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

      describe('when there were already calls to .onAfterEach', () => {
        beforeEach(async () => {
          await plugin.onBeforeAll();
          await plugin.onBeforeEach(testSummaries.running());
          await plugin.onAfterEach(testSummaries.passed());
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

      describe('when there were no calls to .onBeforeEach and .onAfterEach', () => {
        beforeEach(async () => {
          await plugin.onBeforeAll();

          api.requestIdleCallback.mockClear();
          await plugin.onAfterAll();
        });

        itShouldScheduleDiscardingAndUntrackingOfStartupArtifact();
      });

      describe('when all tests were successful', () => {
        beforeEach(async () => {
          await plugin.onBeforeAll();
          await plugin.onBeforeEach(testSummaries.running());
          await plugin.onAfterEach(testSummaries.passed());

          api.requestIdleCallback.mockClear();
          await plugin.onAfterAll();
        });

        itShouldScheduleDiscardingAndUntrackingOfStartupArtifact();
      })
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
    const artifact = {
      type,
      start: jest.fn(),
      stop: jest.fn(),
      save: jest.fn(),
      discard: jest.fn(),
    };

    this.createdArtifacts.push(artifact);
    return artifact;
  }
}
