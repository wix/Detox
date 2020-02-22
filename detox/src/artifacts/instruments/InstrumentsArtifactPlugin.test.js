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
});
