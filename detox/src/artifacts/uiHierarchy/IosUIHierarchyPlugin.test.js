const testSummaries = require('../__mocks__/testSummaries.mock');

jest.mock('../templates/artifact/FileArtifact');
jest.mock('../../client/Client');

describe('IosUIHierarchyPlugin', () => {
  let Client, FileArtifact, IosUIHierarchyPlugin;
  let plugin, api, client, onTestFailed;

  beforeEach(() => {
    Client = require('../../client/Client');
    FileArtifact = require('../templates/artifact/FileArtifact');
    IosUIHierarchyPlugin = require('./IosUIHierarchyPlugin');

    client = new Client();
    client.setEventCallback.mockImplementation((event, callback) => {
      if (event === 'testFailed') {
        onTestFailed = callback;
      }
    });

    api = {
      preparePathForArtifact: jest.fn((name, testSummary) => {
        if (testSummary) {
          return 'artifacts/test/' + name;
        } else {
          return 'artifacts/' + name;
        }
      }),
      userConfig: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
    };

    plugin = new IosUIHierarchyPlugin({ api, client });
  });

  describe('behavior for "testFailed" client events', () => {
    it('should ignore empty view hierarchy on test failure', () => {
      onTestFailed({ params: {} });
      expect(FileArtifact.mock.instances.length).toBe(0);
    });

    it('should capture view hierarchy inside and outside of running test', async () => {
      onTestFailed(aTestFailedPayload(0));

      await plugin.onTestStart(testSummaries.running());
      onTestFailed(aTestFailedPayload(1));
      onTestFailed(aTestFailedPayload(2));
      await plugin.onTestDone(testSummaries.failed());

      onTestFailed(aTestFailedPayload(3));

      await plugin.onBeforeCleanup();

      const [session1, test1, test2, session2] = FileArtifact.mock.instances;

      expect(session1.save).toHaveBeenCalledWith('artifacts/ui.viewhierarchy');
      expect(session2.save).toHaveBeenCalledWith('artifacts/ui2.viewhierarchy');
      expect(test1.save).toHaveBeenCalledWith('artifacts/test/ui.viewhierarchy');
      expect(test2.save).toHaveBeenCalledWith('artifacts/test/ui2.viewhierarchy');
    }); });

  describe('behavior for externally created artifacts', () => {
    it('should validate event.artifact', async () => {
      const artifacts = [0, 1, 2, 3].map(() => new FileArtifact());

      await expect(plugin.onCreateExternalArtifact({ name: 'invalid' }))
        .rejects
        .toThrowError(/Internal error/);
    });

    it('should register snapshots inside and outside of running test', async () => {
      const artifacts = [0, 1, 2, 3].map(() => new FileArtifact());

      await plugin.onCreateExternalArtifact({ name: 'session', artifact: artifacts[0] });
      await plugin.onTestStart(testSummaries.running());
      await plugin.onCreateExternalArtifact({ name: 'test', artifact: artifacts[1] });
      await plugin.onCreateExternalArtifact({ name: 'test', artifact: artifacts[2] });
      await plugin.onTestDone(testSummaries.failed());
      await plugin.onCreateExternalArtifact({ name: 'session', artifact: artifacts[3] });
      await plugin.onBeforeCleanup();

      expect(artifacts[0].save).toHaveBeenCalledWith('artifacts/session.viewhierarchy');
      expect(artifacts[1].save).toHaveBeenCalledWith('artifacts/test/test.viewhierarchy');
      expect(artifacts[2].save).toHaveBeenCalledWith('artifacts/test/test2.viewhierarchy');
      expect(artifacts[3].save).toHaveBeenCalledWith('artifacts/session2.viewhierarchy');
    });
  });

  describe('when disabled', () => {
    beforeEach(() => {
      api.userConfig.enabled = false;
      plugin = new IosUIHierarchyPlugin({ api, client });
    });

    it('should remove the file artifact', () => {
      onTestFailed(aTestFailedPayload(1));
      const [fileArtifact] = FileArtifact.mock.instances;

      expect(fileArtifact.discard).toHaveBeenCalled();
    });
  });

  describe('static parseConfig(config)', () => {
    it('should return .enabled === true if config === "enabled"', () => {
      expect(IosUIHierarchyPlugin.parseConfig('enabled')).toEqual({
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      });
    });

    it('should return .enabled === false if config === "enabled"', () => {
      expect(IosUIHierarchyPlugin.parseConfig('enabled')).toEqual({
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      });
    });
  });

  function aTestFailedPayload(index) {
    return {
      params: {
        viewHierarchyURL: `/tmp/${index}.viewhierarchy`
      },
    };
  }
});
