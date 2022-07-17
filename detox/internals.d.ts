/// <reference types="node" />
/// <reference path="index.d.ts"/>

declare global {
  namespace DetoxInternals {
    type Facade = {
      // region Initialization
      /**
       * Use with a caution, when you still have no config, yet need to avoid {@link Facade#globalSetup}
       */
      resolveConfig(options?: Partial<DetoxGlobalSetupOptions>): Promise<RuntimeConfig>;

      /**
       * This is the phase where Detox reads its configuration, starts a server.
       */
      globalSetup(options?: Partial<DetoxGlobalSetupOptions>): Promise<void>;

      /**
       * This is the phase where Detox loads its expection library and starts a device.
       */
      setup(options?: Partial<DetoxConfigurationSetupOptions>): Promise<void>;

      /**
       * The teardown phase deallocates the device.
       */
      teardown(): Promise<void>;

      /**
       * The global cleanup phase should happen after all the tests have finished.
       * This is the phase where the Detox server shuts down.
       */
      globalTeardown(): Promise<void>;
      // endregion

      // region Lifecycle
      onRunStart(event: unknown): Promise<void>;
      onRunDescribeStart(event: unknown): Promise<void>;
      onTestStart(event: unknown): Promise<void>;
      onHookStart(event: unknown): Promise<void>;
      onHookFailure(event: unknown): Promise<void>;
      onHookSuccess(event: unknown): Promise<void>;
      onTestFnStart(event: unknown): Promise<void>;
      onTestFnFailure(event: unknown): Promise<void>;
      onTestFnSuccess(event: unknown): Promise<void>;
      onTestDone(event: unknown): Promise<void>;
      onRunDescribeFinish(event: unknown): Promise<void>;
      onRunFinish(event: unknown): Promise<void>;

      /**
       * Powers the "--retries <N>" of Detox CLI under the hood.
       */
      reportFailedTests(testFilePaths: string[]): Promise<void>;
      // endregion

      readonly config: RuntimeConfig;
      readonly log: Detox.Logger;
      readonly trace: Detox.Tracer;
      readonly session: SessionState;

      readonly worker: unknown;
    }

    type DetoxGlobalSetupOptions = {
      cwd: string;
      argv: Record<string, unknown>;
      testRunnerArgv: Record<string, unknown>;
      override: Partial<Detox.DetoxConfig>;
    };

    type DetoxConfigurationSetupOptions = {
      global: NodeJS.Global;
      workerId: number;
    };

    type SessionState = Readonly<PrimarySessionState | SecondarySessionState>;

    type SecondarySessionState = {
      workersCount: number;
    };

    type PrimarySessionState = PrimarySessionState & {
      failedTestFiles: string[];
    };

    type RuntimeConfig = Readonly<{
      configurationName: string;

      appsConfig: Record<string, Readonly<Detox.DetoxAppConfig>>;
      artifactsConfig: Detox.DetoxArtifactsConfig;
      behaviorConfig: Detox.DetoxBehaviorConfig;
      cliConfig: DetoxCLIConfig;
      deviceConfig: Detox.DetoxDeviceConfig;
      loggerConfig: Detox.DetoxLoggerConfig;
      runnerConfig: Detox.DetoxTestRunnerConfig;
      sessionConfig: Detox.DetoxSessionConfig;
    }>;

    type DetoxCLIConfig = Readonly<Partial<{
      appLaunchArgs: string;
      artifactsLocation: string;
      captureViewHierarchy: string;
      cleanup: boolean;
      configPath: string;
      configuration: string;
      debugSynchronization: number;
      deviceBootArgs: string;
      deviceName: string;
      forceAdbInstall: boolean;
      gpu: string;
      inspectBrk: boolean;
      headless: boolean;
      jestReportSpecs: boolean;
      keepLockFile: boolean;
      loglevel: string;
      readonlyEmu: boolean;
      recordLogs: string;
      recordPerformance: string;
      recordVideos: string;
      retries: number;
      reuse: string;
      takeScreenshots: string;
      useCustomLogger: string;
    }>>;
  }
}

declare const detox: DetoxInternals.Facade;
export = detox;

