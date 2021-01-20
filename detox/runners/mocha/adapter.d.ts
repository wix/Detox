interface DetoxMochaAdapter {
    detox: Detox.DetoxExportWrapper;
    beforeEach: (context: any) => Promise<void>;
    afterEach: (context: any) => Promise<void>;
}

declare const adapter: DetoxMochaAdapter;

export = adapter;
