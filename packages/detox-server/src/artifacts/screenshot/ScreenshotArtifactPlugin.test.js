const ScreenshotArtifactPlugin = require('./ScreenshotArtifactPlugin');

describe('ScreenshotArtifactPlugin', () => {
  describe('default options', () => {
    it('should have takeAutomaticSnapshots.appReady = true', () => {
      const plugin = new ScreenshotArtifactPlugin({
        api: {
          userConfig: {
            takeWhen: {},
          },
        }
      });

      expect(plugin.takeAutomaticSnapshots.appNotReady).toBe(true);
    });

    it('should allow to set takeAutomaticSnapshots.appReady to false', () => {
      const plugin = new ScreenshotArtifactPlugin({
        api: {
          userConfig: {
            takeWhen: {
              appNotReady: false,
            },
          },
        }
      });

      expect(plugin.takeAutomaticSnapshots.appNotReady).toBe(false);
    });
  });

  describe('static parseConfig(config)', () => {
    const parseConfig = ScreenshotArtifactPlugin.parseConfig;

    const ENABLE_MODES = ['all', 'manual', 'failing', 'blabla'].map(x => [x]);
    const DISABLE_MODES = ['none'].map(x => [x]);

    const AUTOMATIC_MODES = ['all', 'failing'].map(x => [x]);
    const MANUAL_MODES = ['manual', 'none', 'blabla'].map(x => [x]);

    const INCLUSIVE_MODES = ['all', 'manual', 'none', 'blabla'].map(x => [x]);
    const EXCLUSIVE_MODES = ['failing'].map(x => [x]);

    it.each(ENABLE_MODES)('should enable plugin if config = %j', (config) =>
        expect(parseConfig(config).enabled).toBe(true));

    it.each(DISABLE_MODES)('should disable plugin if config = %j', (config) =>
        expect(parseConfig(config).enabled).toBe(false));

    it.each(AUTOMATIC_MODES)('should take automatic screenshots if config = %j', (config) =>
        expect(parseConfig(config).shouldTakeAutomaticSnapshots).toBe(true));

    it.each(MANUAL_MODES)('should not take automatic screenshots if config = %j', (config) =>
        expect(parseConfig(config).shouldTakeAutomaticSnapshots).toBe(false));

    it.each(INCLUSIVE_MODES)('should save all screenshots if config = %j', (config) =>
        expect(parseConfig(config).keepOnlyFailedTestsArtifacts).toBe(false));

    it.each(EXCLUSIVE_MODES)('should save all screenshots if config = %j', (config) =>
        expect(parseConfig(config).keepOnlyFailedTestsArtifacts).toBe(true));
  });
});

