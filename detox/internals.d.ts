/// <reference types="node" />
/// <reference path="index.d.ts"/>

declare global {
  namespace DetoxInternals {
    type DetoxStatus = 'inactive' | 'init' | 'active' | 'cleanup';

    type Facade = {
      //#region Initialization
      /**
       * Use with a caution, when you still have no config, yet need to avoid {@link Facade#init}
       */
      resolveConfig(options?: Partial<DetoxInitOptions>): Promise<RuntimeConfig>;

      /**
       * Returns one of statuses depending on what’s going with the current Detox context:
       *
       * `inactive` – before `init()` and after `cleanup()` is called.
       * `init` – while `init()` is executing.
       * `active` – after `init()` and before `cleanup()` is called.
       * `cleanup` – while `cleanup()` is executing.
       */
      getStatus(): DetoxStatus;

      /**
       * Starts a new Detox test session with the provided configuration.
       * See {@link https://wix.github.io/Detox/docs/api/internals} for more details.
       */
      init(options?: Partial<DetoxInitOptions>): Promise<void>;

      /**
       * This is the phase where Detox loads its expectation library and boots a device.
       * You don't need to call it separately unless you use `init({ workerId: null })` override.
       */
      installWorker(options?: Partial<DetoxInstallWorkerOptions>): Promise<void>;

      /**
       * Deallocates the device.
       * Most Client API (device, by, element, expect) will stop working, except for the logger.
       */
      uninstallWorker(): Promise<void>;

      /**
       * This method should be called when the main or child process is about to exit.
       * See {@link https://wix.github.io/Detox/docs/api/internals} for more details.
       */
      cleanup(): Promise<void>;
      //#endregion

      //#region Lifecycle
      /**
       * Reports that the test runner started executing a test suite, e.g. a `beforeAll` hook or a first test.
       */
      onRunDescribeStart(event: {
        /** Test suite name */
        name: string;
      }): Promise<void>;
      /**
       * Reports that the test runner started executing a specific test.
       */
      onTestStart(event: {
        /** Test name */
        title: string;
        /** Test name including the ancestor suite titles */
        fullName: string;
        /**
         * N-th time this test is running, if there is a retry mechanism.
         *
         * @default 1
         */
        invocations?: number;
        status: 'running';
      }): Promise<void>;
      /**
       * Reports about an error in the midst of `beforeAll`, `beforeEach`, `afterEach`, `afterAll` or any other hook.
       */
      onHookFailure(event: {
        error: Error | string;
        /**
         * @example 'beforeAll'
         * @example 'afterEach'
         */
        hook: string;
      }): Promise<void>;
      /**
       * Reports about an error in the midst of a test function, `test` or `it`.
       */
      onTestFnFailure(event: {
        error: Error | string;
      }): Promise<void>;
      /**
       * Reports the final status of the test, `passed` or `failed`.
       */
      onTestDone(event: {
        /** Test name */
        title: string;
        /** Test name including the ancestor suite titles */
        fullName: string;
        /**
         * N-th time this test is running, if there is a retry mechanism.
         *
         * @default 1
         */
        invocations?: number;
        status: 'passed' | 'failed';
        /** Whether a timeout was the reason for why the test failed. */
        timedOut?: boolean;
      }): Promise<void>;
      /**
       * Reports that the test runner has finished executing a test suite, e.g. all the `afterAll` hooks have been executed or the last test has finished running.
       */
      onRunDescribeFinish(event: {
        /** Test suite name */
        name: string;
      }): Promise<void>;
      /**
       * Workaround for Jest exiting abruptly in --bail mode.
       * Makes sure that all workers and their test environments are properly torn down.
       * @param [permanent] - forbids further retries
       */
      unsafe_conductEarlyTeardown(permanent?: boolean): Promise<void>;
      /**
       * Reports to Detox CLI about passed and failed test files.
       * The failed test files might be re-run again if
       * {@link Detox.DetoxTestRunnerConfig#retries} is set to a non-zero.
       *
       * @param testResults - reports about test files
       */
      reportTestResults(testResults: DetoxTestFileReport[]): Promise<void>;
      //#endregion

      readonly config: RuntimeConfig;
      readonly log: Detox.Logger;
      readonly session: SessionState;
      readonly tracing: {
        /**
         * Creates a readable stream of the currently recorded events in Chrome Trace Event format.
         *
         * @see {@link https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU}
         * @see {import('trace-event-lib').DurationBeginEvent}
         * @see {import('trace-event-lib').DurationEndEvent}
         * @see {import('trace-event-lib').InstantEvent}
         */
        createEventStream(): NodeJS.ReadableStream;
      };

      /**
       * Not documented on purpose.
       * Provides direct access to the object which holds the device driver, websocket client, matchers, expectations, etc.
       */
      readonly worker: Worker;
    }

    interface Worker extends Detox.DetoxExportWrapper {
      readonly id: string;
    }

    type DetoxInitOptions = {
      cwd: string;
      /**
       * @internal
       */
      argv: Record<string, unknown>;
      testRunnerArgv: Record<string, unknown>;
      override: Partial<Detox.DetoxConfig>;
      /** @inheritDoc */
      global: NodeJS.Global | {};
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
      global: NodeJS.Global | {};
      /**
       * Worker ID. Used to distinguish allocated workers in parallel test execution environment.
       *
       * @default 'worker'
       */
      workerId: string;
    };

    type DetoxTestFileReport = {
      /**
       * Global or relative path to the failed test file.
       */
      testFilePath: string;
      /**
       * Whether the test passed or not.
       */
      success: boolean;
      /**
       * Top-level error if the entire test file failed.
       */
      testExecError?: { name?: string; message: string; stack?: string; };
      /**
       * If the test failed, it should tell whether the failure is permanent.
       * Permanent failure means that the test file should not be re-run.
       *
       * @default false
       * @see {Detox.DetoxTestRunnerConfig#retries}
       */
      isPermanentFailure?: boolean;
    };

    type SessionState = Readonly<{
      /**
       * Randomly generated ID for the entire Detox test session, including retries.
       */
      id: string;
      /**
       * Signalizes that the test session is being torn down.
       * Experimental feature for Jest --bail mode.
       */
      unsafe_earlyTeardown?: boolean;
      /**
       * Results of test file executions. Primarily used for Detox CLI retry mechanism.
       */
      testResults: DetoxTestFileReport[];
      /**
       * Retry index of the test session: 0..retriesCount.
       */
      testSessionIndex: number;
      /**
       * Count of Detox contexts with a worker installed.
       * Oversimplified, it reflects the count of allocated devices in the current test session.
       *
       * @see {Facade#init}
       * @see {Facade#installWorker}
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
      artifacts: Readonly<RuntimeArtifactsConfig>;
      behavior: Readonly<Detox.DetoxBehaviorConfig>;
      cli: Readonly<CLIConfig>;
      device: Readonly<Detox.DetoxDeviceConfig>;
      logger: Readonly<Detox.DetoxLoggerConfig>;
      testRunner: Readonly<Detox.DetoxTestRunnerConfig>;
      session: Readonly<Detox.DetoxSessionConfig>;
    }>;

    type RuntimeArtifactsConfig = {
      rootDir: string;
      pathBuilder: string;
      plugins: Readonly<{
        log: Readonly<Detox.DetoxLogArtifactsPluginConfig>;
        screenshot: Readonly<Detox.DetoxScreenshotArtifactsPluginConfig>;
        video: Readonly<Detox.DetoxVideoArtifactsPluginConfig>;
        instruments: Readonly<Detox.DetoxInstrumentsArtifactsPluginConfig>;
        uiHierarchy: Readonly<Detox.DetoxUIHierarchyArtifactsPluginConfig>;
        [pluginId: string]: unknown;
      }>;
    };

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

