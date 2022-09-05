/// <reference types="node" />
/// <reference path="index.d.ts"/>

declare global {
  namespace DetoxInternals {
    type DetoxStatus = 'inactive' | 'init' | 'active' | 'cleanup';

    type Facade = {
      // region Initialization
      /**
       * Use with a caution, when you still have no config, yet need to avoid {@link Facade#init}
       */
      resolveConfig(options?: Partial<DetoxInitOptions>): Promise<RuntimeConfig>;

      /**
       *
       */
      getStatus(): DetoxStatus;

      /**
       * This is the phase where Detox reads its configuration, starts a server.
       */
      init(options?: Partial<DetoxInitOptions>): Promise<void>;

      /**
       * This is the phase where Detox loads its expectation library and starts a device.
       */
      installWorker(options?: Partial<DetoxInstallWorkerOptions>): Promise<void>;

      /**
       * Deallocates the device.
       */
      uninstallWorker(): Promise<void>;

      /**
       * The global cleanup phase should happen after all the tests have finished.
       * This is the phase where the Detox server shuts down.
       */
      cleanup(): Promise<void>;
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
       * Reports to Detox CLI about failed tests that could have been re-run if
       * {@link Detox.DetoxTestRunnerConfig#retries} is set to a non-zero.
       *
       * @param testFilePaths array of failed test files' paths
       * @param permanent whether the failure is permanent, and the tests
       * should not be re-run.
       */
      reportFailedTests(testFilePaths: string[], permanent?: boolean): Promise<void>;
      // endregion

      readonly config: RuntimeConfig;
      readonly log: Detox.Logger;
      readonly session: SessionState;

      readonly worker: Worker;
    }

    interface Worker extends Detox.DetoxExportWrapper {
      readonly id: string;
    }

    type DetoxInitOptions = {
      cwd: string;
      argv: Record<string, unknown>;
      testRunnerArgv: Record<string, unknown>;
      override: Partial<Detox.DetoxConfig>;
      /** @inheritDoc */
      global: NodeJS.Global;
      /**
       * Worker ID. Used to distinguish allocated workers in parallel test execution environment.
       *
       * If explicitly set to null, tells {@link Facade#init} to skip {@link Facade#installWorker} call.
       * Useful for complex test runner integrations, where you have to install the worker via a separate call,
       * when the environment is ready for that.
       *
       * @default 'worker'
       */
      workerId: string | null;
    };

    type DetoxInstallWorkerOptions = {
      /**
       * Used for integration with sandboxed test environments.
       * {@link DetoxInternals.Facade#setup} might override {@link Console} methods
       * to integrate it with Detox loggeing subsystem.
       */
      global: NodeJS.Global;
      /**
       * Worker ID. Used to distinguish allocated workers in parallel test execution environment.
       *
       * @default 'worker'
       */
      workerId: string;
    };

    type SessionState = Readonly<{
      /**
       * Randomly generated ID for the entire Detox test session, including retries.
       */
      id: string;
      /**
       * Permanently failed test file paths.
       */
      failedTestFiles: string[];
      /**
       * Failed test file paths suggested to retry via Detox CLI mechanism.
       */
      testFilesToRetry: string[];
      /**
       * Retry index of the test session: 0..retriesCount.
       */
      testSessionIndex: number;
      /**
       * TODO
       */
      workersCount: number;
    }>;

    type RuntimeConfig = Readonly<{
      configurationName: string;

      /**
       * Dictionary of app configurations,
       * where the keys are defined by {@link Detox.DetoxAppConfig#name}
       * or equal to "default" if the name is not configured.
       */
      apps: Record<string, Readonly<Detox.DetoxAppConfig>>;
      artifacts: Readonly<Detox.DetoxArtifactsConfig>;
      behavior: Readonly<Detox.DetoxBehaviorConfig>;
      cli: Readonly<CLIConfig>;
      device: Readonly<Detox.DetoxDeviceConfig>;
      logger: Readonly<Detox.DetoxLoggerConfig>;
      testRunner: Readonly<Detox.DetoxTestRunnerConfig>;
      session: Readonly<Detox.DetoxSessionConfig>;
    }>;

    type CLIConfig = Readonly<Partial<{
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

