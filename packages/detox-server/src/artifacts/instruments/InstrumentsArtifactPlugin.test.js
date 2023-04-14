// @ts-nocheck
const InstrumentsArtifactPlugin = require('./InstrumentsArtifactPlugin');

describe('InstrumentsArtifactPlugin', () => {
  describe('static parseConfig(config)', () => {
    const parseConfig = InstrumentsArtifactPlugin.parseConfig;

    const ENABLE_MODES = ['all'].map(x => [x]);
    const DISABLE_MODES = ['none', 'manual', 'failing', 'blabla'].map(x => [x]);
    const INCLUSIVE_MODES = ['all', 'manual', 'none', 'failing', { keepOnlyFailedTestsArtifacts: true }].map(x => [x]);

    it.each(ENABLE_MODES)('should enable plugin if config = %j', (config) =>
      expect(parseConfig(config).enabled).toBe(true));

    it.each(DISABLE_MODES)('should disable plugin if config = %j', (config) =>
      expect(parseConfig(config).enabled).toBe(false));

    it.each(INCLUSIVE_MODES)('should save all screenshots if config = %j', (config) =>
      expect(parseConfig(config).keepOnlyFailedTestsArtifacts).toBe(false));
  });

  describe('recording', () => {
    let plugin, testRecording;

    beforeEach(() => {
      plugin = new InstrumentsArtifactPlugin({
        api: {
          userConfig: {
            enabled: true
          }
        }
      });
      testRecording = {
        stop: jest.fn(),
        start: jest.fn()
      };
    });

    describe('not exists in plugin', () => {
      it('should not be stopped', async () => {
        await plugin._stopRecordingIfExists();
        expect(testRecording.stop).not.toBeCalled();
      });

      it('should not be started', async () => {
        const event = {};
        await plugin.onLaunchApp(event);
        expect(testRecording.start).not.toBeCalledWith({
          dry: true
        });
      });
    });

    describe('exists in plugin', () => {
      beforeEach(() => {
        plugin.testRecording = testRecording;
      });

      it('should be stopped if exists', async () => {
        await plugin._stopRecordingIfExists();
        expect(testRecording.stop).toBeCalled();
      });

      it('should be stopped on onBeforeUninstallApp', async () => {
        await plugin.onBeforeUninstallApp();
        expect(testRecording.stop).toBeCalled();
      });

      it('should be stopped on onBeforeTerminateApp', async () => {
        await plugin.onBeforeTerminateApp();
        expect(testRecording.stop).toBeCalled();
      });

      it('should be stopped on onBeforeShutdownDevice', async () => {
        await plugin.onBeforeShutdownDevice();
        expect(testRecording.stop).toBeCalled();
      });

      it('should be started on onLaunchApp', async () => {
        const event = {};
        await plugin.onLaunchApp(event);
        expect(testRecording.start).toBeCalledWith({
          dry: true
        });
      });
    });
  });
});
