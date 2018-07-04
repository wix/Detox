jest.mock('../../../utils/logger');
const logger = require('../../../utils/logger');
const ArtifactPlugin = require('./ArtifactPlugin');
const testSummaries = require('./__mocks__/testSummaries.mock');

class TestArtifactPlugin extends ArtifactPlugin {}

describe(ArtifactPlugin, () => {
  let api;
  let plugin;

  beforeEach(() => {
    api = {};
    plugin = new TestArtifactPlugin({ api });
  });

  it('should have name', () => {
    expect(plugin.name).toBe(TestArtifactPlugin.name);
  });

  it('should be disabled by default', () => {
    expect(plugin.enabled).toBe(false);
  });

  describe('when enabled', () => {
    beforeEach(() => {
      plugin.enabled = true;
    });

    describe('when it is disabled with no reason', () => {
      beforeEach(() => plugin.disable());

      it('should gain state .enabled = false', () => {
        expect(plugin.enabled).toBe(false);
      });

      it('should not write warnings to log', () => {
        expect(logger.warn.mock.calls.length).toBe(0);
      });
    });

    describe('if it is disabled with a reason', () => {
      beforeEach(() => plugin.disable('a reason why it is disabled'));

      it('should gain state .enabled = false', () => {
        expect(plugin.enabled).toBe(false);
      });

      it('should log warning to log with that reason', () => {
        expect(logger.warn.mock.calls.length).toBe(1);
        expect(logger.warn.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('when already disabled', () => {
    beforeEach(() => {
      plugin.enabled = false;
    });

    describe('when .disable() called with a reason', () => {
      beforeEach(() => {
        plugin.disable('a reason why it is disabled');
      });

      it('should not write any warnings to log', () => {
        expect(logger.warn.mock.calls.length).toBe(0);
      });
    });
  });

  describe('lifecycle hooks', () => {
    it('should have .onBeforeRelaunchApp', async () =>
      await expect(plugin.onBeforeRelaunchApp({
        deviceId: 'testDeviceId',
        bundleId: 'testBundleId'
      })).resolves.toBe(void 0));

    it('should have .onRelaunchApp', async () =>
      await expect(plugin.onRelaunchApp({
        deviceId: 'testDeviceId',
        bundleId: 'testBundleId',
        pid: 2018
      })).resolves.toBe(void 0));

    it('should have .onBeforeAll', async () =>
      await expect(plugin.onBeforeAll()).resolves.toBe(void 0));

    it('should have .onBeforeEach', async () => {
      const testSummary = testSummaries.running();
      await expect(plugin.onBeforeEach(testSummary)).resolves.toBe(void 0);
    });

    it('should have .onBeforeResetDevice', async () =>
      await expect(plugin.onBeforeResetDevice({
        deviceId: 'testDeviceId',
      })).resolves.toBe(void 0));

    it('should have .onResetDevice', async () =>
      await expect(plugin.onResetDevice({
        deviceId: 'testDeviceId',
      })).resolves.toBe(void 0));

    it('should have .onAfterEach', async () =>
      await expect(plugin.onAfterEach(testSummaries.failed())).resolves.toBe(void 0));

    it('should have .onAfterAll', async () =>
      await expect(plugin.onAfterAll()).resolves.toBe(void 0));

    describe('.onTerminate', () => {
      it('should disable plugin with a reason', async () => {
        plugin.disable = jest.fn();
        await expect(plugin.onTerminate()).resolves.toBe(void 0);
        expect(plugin.disable.mock.calls).toMatchSnapshot();
      });

      it('should replace the other lifecycle hooks with the same noop function', async () => {
        await plugin.onTerminate();

        expect(plugin.onBeforeRelaunchApp).toBe(plugin.onTerminate);
        expect(plugin.onRelaunchApp).toBe(plugin.onTerminate);
        expect(plugin.onBeforeAll).toBe(plugin.onTerminate);
        expect(plugin.onBeforeEach).toBe(plugin.onTerminate);
        expect(plugin.onBeforeResetDevice).toBe(plugin.onTerminate);
        expect(plugin.onResetDevice).toBe(plugin.onTerminate);
        expect(plugin.onAfterEach).toBe(plugin.onTerminate);
        expect(plugin.onAfterAll).toBe(plugin.onTerminate);
      });

      it('should not work after the first call', async () => {
        const realOnTerminate = plugin.onTerminate;
        await plugin.onTerminate();
        expect(plugin.onTerminate).not.toBe(realOnTerminate);

        plugin.disable = jest.fn();
        await plugin.onTerminate();
        expect(plugin.disable).not.toHaveBeenCalled();
      });
    });
  });

  describe('.shouldKeepArtifactOfTest', () => {
    it('should by default have a setting to keep all', () => {
      expect(plugin.keepOnlyFailedTestsArtifacts).toBe(false);
    });

    describe('if should not keep specifically failed test artifacts', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = false;
      });

      it('should return true for testSummary.status === running', () =>
        expect(plugin.shouldKeepArtifactOfTest(testSummaries.running())).toBe(true));

      it('should return true for testSummary.status === passed', () =>
        expect(plugin.shouldKeepArtifactOfTest(testSummaries.passed())).toBe(true));

      it('should return true for testSummary.status === failed', () =>
        expect(plugin.shouldKeepArtifactOfTest(testSummaries.failed())).toBe(true));
    });

    describe('if should keep only failed test artifacts', () => {
      beforeEach(() => {
        plugin.keepOnlyFailedTestsArtifacts = true;
      });

      it('should return false for testSummary.status === running', () =>
        expect(plugin.shouldKeepArtifactOfTest(testSummaries.running())).toBe(false));

      it('should return false for testSummary.status === passed', () =>
        expect(plugin.shouldKeepArtifactOfTest(testSummaries.passed())).toBe(false));

      it('should return true for testSummary.status === failed', () =>
        expect(plugin.shouldKeepArtifactOfTest(testSummaries.failed())).toBe(true));
    });
  });
});
