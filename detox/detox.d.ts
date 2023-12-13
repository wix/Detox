// TypeScript definitions for Detox
// Original authors (from DefinitelyTyped):
// * Jane Smith <jsmith@example.com>
// * Tareq El-Masri <https://github.com/TareqElMasri>
// * Steve Chun <https://github.com/stevechun>
// * Hammad Jutt <https://github.com/hammadj>
// * pera <https://github.com/santiagofm>
// * Max Komarychev <https://github.com/maxkomarychev>
// * Dor Ben Baruch <https://github.com/Dor256>

import { BunyanDebugStreamOptions } from 'bunyan-debug-stream';

declare global {
    namespace Detox {
        //#region DetoxConfig

        interface DetoxConfig extends DetoxConfigurationCommon {
            /**
             * @example extends: './relative/detox.config'
             * @example extends: '@my-org/detox-preset'
             */
            extends?: string;

            apps?: Record<string, DetoxAppConfig>;
            devices?: Record<string, DetoxDeviceConfig>;
            selectedConfiguration?: string;
            configurations: Record<string, DetoxConfiguration>;
        }

        type DetoxConfigurationCommon = {
            artifacts?: false | DetoxArtifactsConfig;
            behavior?: DetoxBehaviorConfig;
            logger?: DetoxLoggerConfig;
            session?: DetoxSessionConfig;
            testRunner?: DetoxTestRunnerConfig;
        };

        interface DetoxArtifactsConfig {
            rootDir?: string;
            pathBuilder?: string;
            plugins?: {
                log?: 'none' | 'failing' | 'all' | DetoxLogArtifactsPluginConfig;
                screenshot?: 'none' | 'manual' | 'failing' | 'all' | DetoxScreenshotArtifactsPluginConfig;
                video?: 'none' | 'failing' | 'all' | DetoxVideoArtifactsPluginConfig;
                instruments?: 'none' | 'all' | DetoxInstrumentsArtifactsPluginConfig;
                uiHierarchy?: 'disabled' | 'enabled' | DetoxUIHierarchyArtifactsPluginConfig;

                [pluginId: string]: unknown;
            };
        }

        interface DetoxBehaviorConfig {
            init?: {
                /**
                 * By default, Detox exports `device`, `expect`, `element`, `by` and `waitFor`
                 * as global variables. If you want to control their initialization manually,
                 * set this property to `false`.
                 *
                 * This is useful when during E2E tests you also need to run regular expectations
                 * in Node.js. Jest's `expect` for instance, will not be overridden by Detox when
                 * this option is used.
                 */
                exposeGlobals?: boolean;
                /**
                 * By default, Detox will uninstall and install the app upon initialization.
                 * If you wish to reuse the existing app for a faster run, set the property to
                 * `false`.
                 */
                reinstallApp?: boolean;
                /**
                 * When false, `detox test` command always deletes the shared lock file on start,
                 * assuming it had been left from the previous, already finished test session.
                 * The lock file contains information about busy and free devices and ensures
                 * no device can be used simultaneously by multiple test workers.
                 *
                 * Setting it to **true** might be useful when if you need to run multiple
                 * `detox test` commands in parallel, e.g. test a few configurations at once.
                 *
                 * @default false
                 */
                keepLockFile?: boolean;
            };
            launchApp?: 'auto' | 'manual';
            cleanup?: {
                shutdownDevice?: boolean;
            };
        }

        type _DetoxLoggerOptions = Omit<BunyanDebugStreamOptions, 'out'>;

        interface DetoxLoggerConfig {
            /**
             * Log level filters the messages printed to your terminal,
             * and it does not affect the logs written to the artifacts.
             *
             * Use `info` by default.
             * Use `error` or warn when you want to make the output as silent as possible.
             * Use `debug` to control what generally is happening under the hood.
             * Use `trace` when troubleshooting specific issues.
             *
             * @default 'info'
             */
            level?: DetoxLogLevel;
            /**
             * When enabled, hijacks all the console methods (console.log, console.warn, etc)
             * so that the messages printed via them are formatted and saved as Detox logs.
             *
             * @default true
             */
            overrideConsole?: boolean;
            /**
             * Since Detox is using
             * {@link https://www.npmjs.com/package/bunyan-debug-stream bunyan-debug-stream}
             * for printing logs, all its options are exposed for sake of simplicity
             * of customization.
             *
             * The only exception is {@link BunyanDebugStreamOptions#out} option,
             * which is always set to `process.stdout`.
             *
             * You can also pass a callback function to override the logger config
             * programmatically, e.g. depending on the selected log level.
             *
             * @see {@link BunyanDebugStreamOptions}
             */
            options?: _DetoxLoggerOptions | ((config: Partial<DetoxLoggerConfig>) => _DetoxLoggerOptions);
        }

        interface DetoxSessionConfig {
            autoStart?: boolean;
            debugSynchronization?: number;
            server?: string;
            sessionId?: string;
        }

        interface DetoxTestRunnerConfig {
            args?: {
                /**
                 * The command to use for runner: 'jest', 'nyc jest',
                 */
                $0: string;
                /**
                 * The positional arguments to pass to the runner.
                 */
                _?: string[];
                /**
                 * Any other properties recognized by test runner
                 */
                [prop: string]: unknown;
            };

            /**
             * This is an add-on section used by our Jest integration code (but not Detox core itself).
             * In other words, if you’re implementing (or using) a custom integration with some other test runner, feel free to define a section for yourself (e.g. `testRunner.mocha`)
             */
            jest?: {
                /**
                 * Environment setup timeout
                 *
                 * As a part of the environment setup, Detox boots the device and installs the apps.
                 * If that takes longer than the specified value, the entire test suite will be considered as failed, e.g.:
                 * ```plain text
                 * FAIL  e2e/starter.test.js
                 * ● Test suite failed to run
                 *
                 * Exceeded timeout of 300000ms while setting up Detox environment
                 * ```
                 *
                 * The default value is 5 minutes.
                 *
                 * @default 300000
                 * @see {@link https://jestjs.io/docs/configuration/#testenvironment-string}
                 */
                setupTimeout?: number | undefined;
                /**
                 * Environemnt teardown timeout
                 *
                 * If the environment teardown takes longer than the specified value, Detox will throw a timeout error.
                 * The default value is half a minute.
                 *
                 * @default 30000 (30 seconds)
                 * @see {@link https://jestjs.io/docs/configuration/#testenvironment-string}
                 */
                teardownTimeout?: number | undefined;
                /**
                 * Jest provides an API to re-run individual failed tests: `jest.retryTimes(count)`.
                 * When Detox detects the use of this API, it suppresses its own CLI retry mechanism controlled via `detox test … --retries <N>` or {@link DetoxTestRunnerConfig#retries}.
                 * The motivation is simple – activating the both mechanisms is apt to increase your test duration dramatically, if your tests are flaky.
                 * If you wish nevertheless to use both the mechanisms simultaneously, set it to `true`.
                 *
                 * @default false
                 * @see {@link https://jestjs.io/docs/29.0/jest-object#jestretrytimesnumretries-options}
                 */
                retryAfterCircusRetries?: boolean;
                /**
                 * By default, Jest prints the test names and their status (_passed_ or _failed_) at the very end of the test session.
                 * When enabled, it makes Detox to print messages like these each time the new test starts and ends:
                 * ```plain text
                 * 18:03:36.258 detox[40125] i Sanity: should have welcome screen
                 * 18:03:37.495 detox[40125] i Sanity: should have welcome screen [OK]
                 * 18:03:37.496 detox[40125] i Sanity: should show hello screen after tap
                 * 18:03:38.928 detox[40125] i Sanity: should show hello screen after tap [OK]
                 * 18:03:38.929 detox[40125] i Sanity: should show world screen after tap
                 * 18:03:40.351 detox[40125] i Sanity: should show world screen after tap [OK]
                 * ```
                 * By default, it is enabled automatically in test sessions with a single worker.
                 * And vice versa, if multiple tests are executed concurrently, Detox turns it off to avoid confusion in the log.
                 * Use boolean values, `true` or `false`, to turn off the automatic choice.
                 *
                 * @default undefined
                 */
                reportSpecs?: boolean | undefined;
                /**
                 * In the environment setup phase, Detox boots the device and installs the apps.
                 * This flag tells Detox to print messages like these every time the device gets assigned to a specific suite:
                 *
                 * ```plain text
                 * 18:03:29.869 detox[40125] i starter.test.js is assigned to 4EC84833-C7EA-4CA3-A6E9-5C30A29EA596 (iPhone 15)
                 * ```
                 *
                 * @default true
                 */
                reportWorkerAssign?: boolean | undefined;
            };
            /**
             * Retries count. Zero means a single attempt to run tests.
             */
            retries?: number;
            /**
             * When true, tells Detox CLI to cancel next retrying if it gets
             * at least one report about a permanent test suite failure.
             * Has no effect, if {@link DetoxTestRunnerConfig#retries} is
             * undefined or set to zero.
             *
             * @default false
             * @see {DetoxInternals.DetoxTestFileReport#isPermanentFailure}
             */
            bail?: boolean;
            /**
             * When true, tells `detox test` to spawn the test runner in a detached mode.
             * This is useful in CI environments, where you want to intercept SIGINT and SIGTERM signals to gracefully shut down the test runner and the device.
             * Instead of passing the kill signal to the child process (the test runner), Detox will send an emergency shutdown request to all the workers, and then it will wait for them to finish.
             * @default false
             */
            detached?: boolean;
            /**
             * Custom handler to process --inspect-brk CLI flag.
             * Use it when you rely on another test runner than Jest to mutate the config.
             */
            inspectBrk?: (config: DetoxTestRunnerConfig) => void;
            /**
             * Forward environment variables to the spawned test runner
             * accordingly to the given CLI argument overrides.
             *
             * If false, Detox CLI will be only printing a hint message on
             * how to start the test runner using environment variables,
             * in case when a user wants to avoid using Detox CLI.
             *
             * @default false
             */
            forwardEnv?: boolean;
        }

        type DetoxAppConfig = (DetoxBuiltInAppConfig | DetoxCustomAppConfig) & {
            /**
             * App name to use with device.selectApp(appName) calls.
             * Can be omitted if you have a single app under the test.
             *
             * @see Device#selectApp
             */
            name?: string;
        };

        type DetoxDeviceConfig = DetoxBuiltInDeviceConfig | DetoxCustomDriverConfig;

        interface DetoxLogArtifactsPluginConfig {
            enabled?: boolean;
            keepOnlyFailedTestsArtifacts?: boolean;
        }

        interface DetoxScreenshotArtifactsPluginConfig {
            enabled?: boolean;
            keepOnlyFailedTestsArtifacts?: boolean;
            shouldTakeAutomaticSnapshots?: boolean;
            takeWhen?: {
                testStart?: boolean;
                testFailure?: boolean;
                testDone?: boolean;
                appNotReady?: boolean;
            };
        }

        interface DetoxVideoArtifactsPluginConfig {
            enabled?: boolean;
            keepOnlyFailedTestsArtifacts?: boolean;
            android?: Partial<{
                size: [number, number];
                bitRate: number;
                timeLimit: number;
                verbose: boolean;
            }>;
            simulator?: Partial<{
                codec: string;
            }>;
        }

        interface DetoxInstrumentsArtifactsPluginConfig {
            enabled?: boolean;
        }

        interface DetoxUIHierarchyArtifactsPluginConfig {
            enabled?: boolean;
        }

        type DetoxBuiltInAppConfig = (DetoxIosAppConfig | DetoxAndroidAppConfig);

        interface DetoxIosAppConfig {
            type: 'ios.app';
            binaryPath: string;
            bundleId?: string;
            build?: string;
            start?: string;
            launchArgs?: Record<string, any>;
        }

        interface DetoxAndroidAppConfig {
            type: 'android.apk';
            binaryPath: string;
            bundleId?: string;
            build?: string;
            start?: string;
            testBinaryPath?: string;
            launchArgs?: Record<string, any>;
            /**
             * TCP ports to `adb reverse` upon the installation.
             * E.g. 8081 - to be able to access React Native packager in Debug mode.
             *
             * @example [8081]
             */
            reversePorts?: number[];
        }

        interface DetoxCustomAppConfig {
            type: string;

            [prop: string]: unknown;
        }

        type DetoxBuiltInDeviceConfig =
            | DetoxIosSimulatorDriverConfig
            | DetoxAttachedAndroidDriverConfig
            | DetoxAndroidEmulatorDriverConfig
            | DetoxGenymotionCloudDriverConfig;

        interface DetoxIosSimulatorDriverConfig {
            type: 'ios.simulator';
            device: string | Partial<IosSimulatorQuery>;
            bootArgs?: string;
        }

        interface DetoxSharedAndroidDriverConfig {
            forceAdbInstall?: boolean;
            utilBinaryPaths?: string[];
        }

        interface DetoxAttachedAndroidDriverConfig extends DetoxSharedAndroidDriverConfig {
            type: 'android.attached';
            device: string | { adbName: string };
        }

        interface DetoxAndroidEmulatorDriverConfig extends DetoxSharedAndroidDriverConfig {
            type: 'android.emulator';
            device: string | { avdName: string };
            bootArgs?: string;
            gpuMode?: 'auto' | 'host' | 'swiftshader_indirect' | 'angle_indirect' | 'guest' | 'off';
            headless?: boolean;
            /**
             * @default true
             */
            readonly?: boolean;
        }

        interface DetoxGenymotionCloudDriverConfig extends DetoxSharedAndroidDriverConfig {
            type: 'android.genycloud';
            device: string | { recipeUUID: string; } | { recipeName: string; };
        }

        interface DetoxCustomDriverConfig {
            type: string;

            [prop: string]: unknown;
        }

        interface IosSimulatorQuery {
            id: string;
            type: string;
            name: string;
            os: string;
        }

        type DetoxConfiguration = DetoxConfigurationCommon & (
            | DetoxConfigurationSingleApp
            | DetoxConfigurationMultiApps
            );

        interface DetoxConfigurationSingleApp {
            device: DetoxAliasedDevice;
            app: DetoxAliasedApp;
        }

        interface DetoxConfigurationMultiApps {
            device: DetoxAliasedDevice;
            apps: DetoxAliasedApp[];
        }

        type DetoxAliasedDevice = string | DetoxDeviceConfig;

        type DetoxAliasedApp = string | DetoxAppConfig;

        //#endregion

        interface DetoxExportWrapper {
            readonly device: Device;

            readonly element: ElementFacade;

            readonly waitFor: WaitForFacade;

            readonly expect: ExpectFacade;

            readonly by: ByFacade;

            readonly web: WebFacade;

            readonly DetoxConstants: {
                userNotificationTriggers: {
                    push: 'push';
                    calendar: 'calendar';
                    timeInterval: 'timeInterval';
                    location: 'location';
                };
                userActivityTypes: {
                    searchableItem: string;
                    browsingWeb: string;
                },
                searchableItemActivityIdentifier: string;
            };

            /**
             * Detox logger instance. Can be used for saving user logs to the general log file.
             */
            readonly log: Logger;

            /**
             * @deprecated
             *
             * Deprecated - use {@link Detox.Logger#trace}
             * Detox tracer instance. Can be used for building timelines in Google Event Tracing format.
             */
            readonly trace: {
                /** @deprecated */
                readonly startSection: (name: string) => void;
                /** @deprecated */
                readonly endSection: (name: string) => void;
            };

            /**
             * Trace a single call, with a given name and arguments.
             *
             * @deprecated
             * @param sectionName The name of the section to trace.
             * @param promiseOrFunction Promise or a function that provides a promise.
             * @param args Optional arguments to pass to the trace.
             * @returns The returned value of the traced call.
             * @see https://wix.github.io/Detox/docs/19.x/api/detox-object-api/#detoxtracecall
             */
            readonly traceCall: <T>(event: string, action: () => Promise<T>, args?: Record<string, unknown>) => Promise<T>;
        }

        interface Logger {
            readonly level: DetoxLogLevel;

            readonly fatal: _LogMethod;
            readonly error: _LogMethod;
            readonly warn: _LogMethod;
            readonly info: _LogMethod;
            readonly debug: _LogMethod;
            readonly trace: _LogMethod;

            child(context?: Partial<LogEvent>): Logger;
        }

        /** @internal */
        interface _LogMethod extends _LogMethodSignature {
            readonly begin: _LogMethodSignature;
            readonly complete: _CompleteMethodSignature;
            readonly end: _LogMethodSignature;
        }

        /** @internal */
        interface _LogMethodSignature {
            (...args: unknown[]): void
            (event: LogEvent, ...args: unknown[]): void;
        }

        /** @internal */
        interface _CompleteMethodSignature {
            <T>(message: string, action: T | (() => T)): T;
            <T>(event: LogEvent, message: string, action: T | (() => T)): T;
        }

        type LogEvent = {
            /** Use when there's a risk of logging several parallel duration events. */
            id?: string | number;
            /** Optional. Event categories (tags) to facilitate filtering. */
            cat?: string | string[];
            /** Optional. Color name (applicable in Google Chrome Trace Format) */
            cname?: string;

            /** Reserved property. Process ID. */
            pid?: never;
            /** Reserved property. Thread ID. */
            tid?: never;
            /** Reserved property. Timestamp. */
            ts?: never;
            /** Reserved property. Event phase. */
            ph?: never;

            [customProperty: string]: unknown;
        };

        type DetoxLogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

        type Point2D = {
            x: number,
            y: number,
        }

        /**
         * A construct allowing for the querying and modification of user arguments passed to an app upon launch by Detox.
         *
         * @see AppLaunchArgs#modify
         * @see AppLaunchArgs#reset
         * @see AppLaunchArgs#get
         */
        interface AppLaunchArgs {
            /**
             * Shared (global) arguments that are not specific to a particular application.
             * Selecting another app does not reset them, yet they still can be overridden
             * by configuring app-specific launch args.
             * @see Device#selectApp
             * @see AppLaunchArgs
             */
            readonly shared: ScopedAppLaunchArgs;

            /**
             * Modify the launch-arguments via a modifier object, according to the following logic:
             * - Non-nullish modifier properties would set a new value or override the previous value of
             *   existing properties with the same name.
             * - Modifier properties set to either `undefined` or `null` would delete the corresponding property
             *   if it existed.
             * These custom app launch arguments get erased whenever you select a different application.
             * If you need to share them between all the applications, use {@link AppLaunchArgs#shared} property.
             * Note: app-specific launch args have a priority over shared ones.
             *
             * @param modifier The modifier object.
             * @example
             * // With current launch arguments set to:
             * // {
             * //   mockServerPort: 1234,
             * //   mockServerCredentials: 'user@test.com:12345678',
             * // }
             * device.appLaunchArgs.modify({
             *   mockServerPort: 4321,
             *   mockServerCredentials: null,
             *   mockServerToken: 'abcdef',
             * });
             * await device.launchApp();
             * // ==> launch-arguments become:
             * // {
             * //   mockServerPort: 4321,
             * //   mockServerToken: 'abcdef',
             * // }
             */
            modify(modifier: object): this;

            /**
             * Reset all app-specific launch arguments (back to an empty object).
             * If you need to reset the shared launch args, use {@link AppLaunchArgs#shared}.
             */
            reset(): this;

            /**
             * Get all currently set launch arguments (including shared ones).
             * @returns An object containing all launch-arguments.
             * Note: mutating the values inside the result object is pointless, as it is immutable.
             */
            get(): object;
        }

        /**
         * Shared (global) arguments that are not specific to a particular application.
         */
        interface ScopedAppLaunchArgs {
            /** @see AppLaunchArgs#modify */
            modify(modifier: object): this;

            /** @see AppLaunchArgs#reset */
            reset(): this;

            /** @see AppLaunchArgs#get */
            get(): object;
        }

        type DigitWithoutZero = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
        type Digit = 0 | DigitWithoutZero;
        type BatteryLevel = `${Digit}` | `${DigitWithoutZero}${Digit}` | "100";

        interface Device {
            /**
             * Holds the environment-unique ID of the device, namely, the adb ID on Android (e.g. emulator-5554) and the Mac-global simulator UDID on iOS -
             * as used by simctl (e.g. AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE).
             */
            id: string;
            /**
             * Holds a descriptive name of the device. Example: emulator-5554 (Pixel_API_29)
             */
            name: string;

            /**
             * Select the current app (relevant only to multi-app configs) by its name.
             * After execution, all app-specific device methods will target the selected app.
             *
             * @see DetoxAppConfig#name
             * @example
             * await device.selectApp('passenger');
             * await device.launchApp(); // passenger
             * // ... run tests for the passenger app
             * await device.uninstallApp(); // passenger
             * await device.selectApp('driver');
             * await device.installApp(); // driver
             * await device.launchApp(); // driver
             * // ... run tests for the driver app
             * await device.terminateApp(); // driver
             */
            selectApp(app: string): Promise<void>;

            // TODO: document permissions types.
            /**
             * Launch the app.
             *
             * <p>For info regarding launch arguments, refer to the [dedicated guide](https://wix.github.io/Detox/docs/guide/launch-args).
             *
             * @example
             * // Terminate the app and launch it again. If set to false, the simulator will try to bring app from background,
             * // if the app isn't running, it will launch a new instance. default is false
             * await device.launchApp({newInstance: true});
             * @example
             * // Grant or deny runtime permissions for your application.
             * await device.launchApp({permissions: {calendar: 'YES'}});
             * @example
             * // Mock opening the app from URL to test your app's deep link handling mechanism.
             * await device.launchApp({url: url});
             * @example
             * // Start the app with some custom arguments.
             * await device.launchApp({
             *   launchArgs: {arg1: 1, arg2: "2"},
             * });
             */
            launchApp(config?: DeviceLaunchAppConfig): Promise<void>;

            /**
             * Relaunch the app. Convenience method that calls {@link Device#launchApp}
             * with { newInstance: true } override.
             *
             * @deprecated
             * @param config
             * @see Device#launchApp
             */
            relaunchApp(config?: DeviceLaunchAppConfig): Promise<void>;

            /**
             * Access the user-defined launch-arguments predefined through static scopes such as the Detox configuration file and
             * command-line arguments. This access allows - through dedicated methods, for both value-querying and
             * modification (see {@link AppLaunchArgs}).
             * Refer to the [dedicated guide](https://wix.github.io/Detox/docs/api/launch-args) for complete details.
             *
             * @example
             * // With Detox being preconfigured statically to use these arguments in app launch:
             * // {
             * //   mockServerPort: 1234,
             * // }
             * // The following code would result in these arguments eventually passed into the launched app:
             * // {
             * //   mockServerPort: 4321,
             * //   mockServerToken: 'uvwxyz',
             * // }
             * device.appLaunchArgs.modify({
             *   mockServerPort: 4321,
             *   mockServerToken: 'abcdef',
             * });
             * await device.launchApp({ launchArgs: { mockServerToken: 'uvwxyz' } });
             *
             * @see AppLaunchArgs
             */
            appLaunchArgs: AppLaunchArgs;

            /**
             * Terminate the app.
             *
             * @example
             * // By default, terminateApp() with no params will terminate the app
             * await device.terminateApp();
             * @example
             * // To terminate another app, specify its bundle id
             * await device.terminateApp('other.bundle.id');
             */
            terminateApp(bundle?: string): Promise<void>;

            /**
             * Send application to background by bringing com.apple.springboard to the foreground.
             * Combining sendToHome() with launchApp({newInstance: false}) will simulate app coming back from background.
             * @example
             * await device.sendToHome();
             * await device.launchApp({newInstance: false});
             */
            sendToHome(): Promise<void>;

            /**
             * If this is a React Native app, reload the React Native JS bundle. This action is much faster than device.launchApp(), and can be used if you just need to reset your React Native logic.
             *
             * @example await device.reloadReactNative()
             */
            reloadReactNative(): Promise<void>;

            /**
             * By default, installApp() with no params will install the app file defined in the current configuration.
             * To install another app, specify its path
             * @example await device.installApp();
             * @example await device.installApp('path/to/other/app');
             */
            installApp(path?: any): Promise<void>;

            /**
             * By default, uninstallApp() with no params will uninstall the app defined in the current configuration.
             * To uninstall another app, specify its bundle id
             * @example await device.installApp('other.bundle.id');
             */
            uninstallApp(bundle?: string): Promise<void>;

            /**
             * Mock opening the app from URL. sourceApp is an optional parameter to specify source application bundle id.
             */
            openURL(url: { url: string; sourceApp?: string }): Promise<void>;

            /**
             * Mock handling of received user notification when app is in foreground.
             */
            sendUserNotification(...params: any[]): Promise<void>;

            /**
             * Mock handling of received user activity when app is in foreground.
             */
            sendUserActivity(...params: any[]): Promise<void>;

            /**
             * Takes "portrait" or "landscape" and rotates the device to the given orientation. Currently only available in the iOS Simulator.
             */
            setOrientation(orientation: Orientation): Promise<void>;

            /**
             * Sets the simulator/emulator location to the given latitude and longitude.
             *
             * <p/>On iOS `setLocation` is dependent on [fbsimctl](https://github.com/facebook/idb/tree/4b7929480c3c0f158f33f78a5b802c1d0e7030d2/fbsimctl)
             * which [is now deprecated](https://github.com/wix/Detox/issues/1371).
             * If `fbsimctl` is not installed, the command will fail, asking for it to be installed.
             *
             * <p/>On Android `setLocation` will work with both Android Emulator (bundled with Android development tools) and Genymotion.
             * The correct permissions must be set in your app manifest.
             *
             * @example await device.setLocation(32.0853, 34.7818);
             */
            setLocation(lat: number, lon: number): Promise<void>;

            /**
             * (iOS only) Override simulator’s status bar.
             * @platform iOS
             * @param {config} config status bar configuration.
             * @example
             * await device.setStatusBar({
             *   time: "12:34",
             *   // Set the date or time to a fixed value.
             *   // If the string is a valid ISO date string it will also set the date on relevant devices.
             *   dataNetwork: "wifi",
             *   // If specified must be one of 'hide', 'wifi', '3g', '4g', 'lte', 'lte-a', 'lte+', '5g', '5g+', '5g-uwb', or '5g-uc'.
             *   wifiMode: "failed",
             *   // If specified must be one of 'searching', 'failed', or 'active'.
             *   wifiBars: "2",
             *   // If specified must be 0-3.
             *   cellularMode: "searching",
             *   // If specified must be one of 'notSupported', 'searching', 'failed', or 'active'.
             *   cellularBars: "3",
             *   // If specified must be 0-4.
             *   operatorName: "A1",
             *   // Set the cellular operator/carrier name. Use '' for the empty string.
             *   batteryState: "charging",
             *   // If specified must be one of 'charging', 'charged', or 'discharging'.
             *   batteryLevel: "50",
             *   // If specified must be 0-100.
             *  });
             */
            setStatusBar(config: {
              time?: string,
              dataNetwork?: "hide" | "wifi" | "3g" | "4g" | "lte" | "lte-a" | "lte+" | "5g" | "5g+" | "5g-uwb" | "5g-uc",
              wifiMode?: "searching" |"failed" | "active",
              wifiBars?: "0" | "1" | "2" | "3",
              cellularMode?: "notSupported" | "searching" | "failed" | "active",
              cellularBars?: "0" | "1" | "2" | "3" | "4",
              operatorName?: string;
              batteryState?: "charging" | "charged" | "discharging",
              batteryLevel?: BatteryLevel,
            }): Promise<void>;

            /**
             * Disable network synchronization mechanism on preferred endpoints. Useful if you want to on skip over synchronizing on certain URLs.
             *
             * @example await device.setURLBlacklist(['.*127.0.0.1.*']);
             */
            setURLBlacklist(urls: string[]): Promise<void>;

            /**
             * Temporarily disable synchronization (idle/busy monitoring) with the app - namely, stop waiting for the app to go idle before moving forward in the test execution.
             *
             * <p/>This API is useful for cases where test assertions must be made in an area of your application where it is okay for it to ever remain partly *busy* (e.g. due to an
             * endlessly repeating on-screen animation). However, using it inherently suggests that you are likely to resort to applying `sleep()`'s in your test code - testing
             * that area, **which is not recommended and can never be 100% stable.
             * **Therefore, as a rule of thumb, test code running "inside" a sync-disabled mode must be reduced to the bare minimum.
             *
             * <p/>Note: Synchronization is enabled by default, and it gets **reenabled on every launch of a new instance of the app.**
             *
             * @example await device.disableSynchronization();
             */
            disableSynchronization(): Promise<void>;

            /**
             * Reenable synchronization (idle/busy monitoring) with the app - namely, resume waiting for the app to go idle before moving forward in the test execution, after a
             * previous disabling of it through a call to `device.disableSynchronization()`.
             *
             * <p/>Warning: Making this call would resume synchronization **instantly**, having its returned promise only resolve when the app becomes idle again.
             * In other words, this **must only be called after you navigate back to "the safe zone", where the app should be able to eventually become idle again**, or it would
             * remain suspended "forever" (i.e. until a safeguard time-out expires).
             *
             * @example await device.enableSynchronization();
             */
            enableSynchronization(): Promise<void>;

            /**
             * Resets the Simulator to clean state (like the Simulator > Reset Content and Settings... menu item), especially removing previously set permissions.
             *
             * @example await device.resetContentAndSettings();
             */
            resetContentAndSettings(): Promise<void>;

            /**
             * Returns the current device, ios or android.
             *
             * @example
             * if (device.getPlatform() === 'ios') {
             *     await expect(loopSwitch).toHaveValue('1');
             * }
             */
            getPlatform(): 'ios' | 'android';

            /**
             * Takes a screenshot on the device and schedules putting it in the artifacts folder upon completion of the current test.
             * @param name for the screenshot artifact
             * @returns a temporary path to the screenshot.
             * @example
             * test('Menu items should have logout', async () => {
             *   const tempPath = await device.takeScreenshot('tap on menu');
             *   // The temporary path will remain valid until the test completion.
             *   // Afterwards, the screenshot will be moved, e.g.:
             *   // * on success, to: <artifacts-location>/✓ Menu items should have Logout/tap on menu.png
             *   // * on failure, to: <artifacts-location>/✗ Menu items should have Logout/tap on menu.png
             * });
             */
            takeScreenshot(name: string): Promise<string>;

            /**
             * (iOS only) Saves a view hierarchy snapshot (*.viewhierarchy) of the currently opened application
             * to a temporary folder and schedules putting it to the artifacts folder upon the completion of
             * the current test. The file can be opened later in Xcode 12.0 and above.
             * @see https://developer.apple.com/documentation/xcode-release-notes/xcode-12-release-notes#:~:text=57933113
             * @param [name="capture"] optional name for the *.viewhierarchy artifact
             * @returns a temporary path to the captured view hierarchy snapshot.
             * @example
             * test('Menu items should have logout', async () => {
             *   await device.captureViewHierarchy('myElements');
             *   // The temporary path will remain valid until the test completion.
             *   // Afterwards, the artifact will be moved, e.g.:
             *   // * on success, to: <artifacts-location>/✓ Menu items should have Logout/myElements.viewhierarchy
             *   // * on failure, to: <artifacts-location>/✗ Menu items should have Logout/myElements.viewhierarchy
             * });
             */
            captureViewHierarchy(name?: string): Promise<string>;

            /**
             * Simulate shake (iOS Only)
             */
            shake(): Promise<void>;

            /**
             * Toggles device enrollment in biometric auth (TouchID or FaceID) (iOS Only)
             * @example await device.setBiometricEnrollment(true);
             * @example await device.setBiometricEnrollment(false);
             */
            setBiometricEnrollment(enabled: boolean): Promise<void>;

            /**
             * Simulates the success of a face match via FaceID (iOS Only)
             */
            matchFace(): Promise<void>;

            /**
             * Simulates the failure of a face match via FaceID (iOS Only)
             */
            unmatchFace(): Promise<void>;

            /**
             * Simulates the success of a finger match via TouchID (iOS Only)
             */
            matchFinger(): Promise<void>;

            /**
             * Simulates the failure of a finger match via TouchID (iOS Only)
             */
            unmatchFinger(): Promise<void>;

            /**
             * Clears the simulator keychain (iOS Only)
             */
            clearKeychain(): Promise<void>;

            /**
             * Simulate press back button (Android Only)
             * @example await device.pressBack();
             */
            pressBack(): Promise<void>;

            /**
             * (Android Only)
             * Exposes UiAutomator's UiDevice API (https://developer.android.com/reference/android/support/test/uiautomator/UiDevice).
             * This is not a part of the official Detox API,
             * it may break and change whenever an update to UiDevice or UiAutomator gradle dependencies ('androidx.test.uiautomator:uiautomator') is introduced.
             * UIDevice's autogenerated code reference: https://github.com/wix/Detox/blob/master/detox/src/android/espressoapi/UIDevice.js
             */
            getUiDevice(): Promise<void>;

            /**
             * (Android Only)
             * Runs `adb reverse tcp:PORT tcp:PORT` for the current device
             * to enable network requests forwarding on localhost:PORT (computer<->device).
             * For more information, see {@link https://www.reddit.com/r/reactnative/comments/5etpqw/what_do_you_call_what_adb_reverse_is_doing|here}.
             * This is a no-op when running on iOS.
             */
            reverseTcpPort(port: number): Promise<void>;

            /**
             * (Android Only)
             * Runs `adb reverse --remove tcp:PORT tcp:PORT` for the current device
             * to disable network requests forwarding on localhost:PORT (computer<->device).
             * For more information, see {@link https://www.reddit.com/r/reactnative/comments/5etpqw/what_do_you_call_what_adb_reverse_is_doing|here}.
             * This is a no-op when running on iOS.
             */
            unreverseTcpPort(port: number): Promise<void>;
        }

        /**
         * @deprecated
         */
        type DetoxAny = NativeElement & WaitFor;

        interface ElementFacade {
            (by: NativeMatcher): IndexableNativeElement;
        }

        interface IndexableNativeElement extends NativeElement {
            /**
             * Choose from multiple elements matching the same matcher using index
             * @example await element(by.text('Product')).atIndex(2).tap();
             */
            atIndex(index: number): NativeElement;
        }

        interface NativeElement extends NativeElementActions {
        }

        interface ByFacade {
            /**
             * by.id will match an id that is given to the view via testID prop.
             * @example
             * // In a React Native component add testID like so:
             * <TouchableOpacity testID={'tap_me'}>
             * // Then match with by.id:
             * await element(by.id('tap_me'));
             * await element(by.id(/^tap_[a-z]+$/));
             */
            id(id: string | RegExp): NativeMatcher;

            /**
             * Find an element by text, useful for text fields, buttons.
             * @example
             * await element(by.text('Tap Me'));
             * await element(by.text(/^Tap .*$/));
             */
            text(text: string | RegExp): NativeMatcher;

            /**
             * Find an element by accessibilityLabel on iOS, or by contentDescription on Android.
             * @example
             * await element(by.label('Welcome'));
             * await element(by.label(/[a-z]+/i));
             */
            label(label: string | RegExp): NativeMatcher;

            /**
             * Find an element by native view type.
             * @example await element(by.type('RCTImageView'));
             */
            type(nativeViewType: string): NativeMatcher;

            /**
             * Find an element with an accessibility trait. (iOS only)
             * @example await element(by.traits(['button']));
             */
            traits(traits: string[]): NativeMatcher;

            /**
             * Collection of web matchers
             */
            readonly web: ByWebFacade;
        }

        interface ByWebFacade {
            /**
             * Find an element on the DOM tree by its id
             * @param id
             * @example
             * web.element(by.web.id('testingh1'))
             */
            id(id: string): WebMatcher;

            /**
             * Find an element on the DOM tree by its CSS class
             * @param className
             * @example
             * web.element(by.web.className('a'))
             */
            className(className: string): WebMatcher;

            /**
             * Find an element on the DOM tree matching the given CSS selector
             * @param cssSelector
             * @example
             * web.element(by.web.cssSelector('#cssSelector'))
             */
            cssSelector(cssSelector: string): WebMatcher;

            /**
             * Find an element on the DOM tree by its "name" attribute
             * @param name
             * @example
             * web.element(by.web.name('sec_input'))
             */
            name(name: string): WebMatcher;

            /**
             * Find an element on the DOM tree by its XPath
             * @param xpath
             * @example
             * web.element(by.web.xpath('//*[@id="testingh1-1"]'))
             */
            xpath(xpath: string): WebMatcher;

            /**
             * Find an <a> element on the DOM tree by its link text (href content)
             * @param linkText
             * @example
             * web.element(by.web.href('disney.com'))
             */
            href(linkText: string): WebMatcher;

            /**
             * Find an <a> element on the DOM tree by its partial link text (href content)
             * @param linkTextFragment
             * @example
             * web.element(by.web.hrefContains('disney'))
             */
            hrefContains(linkTextFragment: string): WebMatcher;

            /**
             * Find an element on the DOM tree by its tag name
             * @param tag
             * @example
             * web.element(by.web.tag('mark'))
             */
            tag(tagName: string): WebMatcher;
        }

        interface NativeMatcher {
            /**
             * Find an element satisfying all the matchers
             * @example await element(by.text('Product').and(by.id('product_name'));
             */
            and(by: NativeMatcher): NativeMatcher;

            /**
             * Find an element by a matcher with a parent matcher
             * @example await element(by.id('Grandson883').withAncestor(by.id('Son883')));
             */
            withAncestor(parentBy: NativeMatcher): NativeMatcher;

            /**
             * Find an element by a matcher with a child matcher
             * @example await element(by.id('Son883').withDescendant(by.id('Grandson883')));
             */
            withDescendant(childBy: NativeMatcher): NativeMatcher;
        }

        interface WebMatcher {
            __web__: any; // prevent type coersion
        }

        interface ExpectFacade {
            (element: NativeElement): Expect;

            (webElement: WebElement): WebExpect;
        }

        interface WebViewElement {
            element(webMatcher: WebMatcher): IndexableWebElement;
        }

        interface WebFacade extends WebViewElement {
            /**
             * Gets the webview element as a testing element.
             * @param matcher a simple view matcher for the webview element in th UI hierarchy.
             * If there is only ONE webview element in the UI hierarchy, its NOT a must to supply it.
             * If there are MORE then one webview element in the UI hierarchy you MUST supply are view matcher.
             */
            (matcher?: NativeMatcher): WebViewElement;
        }

        interface Expect<R = Promise<void>> {

            /**
             * Expect the view to be at least N% visible. If no number is provided then defaults to 75%. Negating this
             * expectation with a `not` expects the view's visible area to be smaller than N%.
             * @param pct optional integer ranging from 1 to 100, indicating how much percent of the view should be
             *  visible to the user to be accepted.
             * @example await expect(element(by.id('mainTitle'))).toBeVisible(35);
             */
            toBeVisible(pct?: number): R;

            /**
             * Negate the expectation.
             * @example await expect(element(by.id('cancelButton'))).not.toBeVisible();
             */
            not: this;

            /**
             * Expect the view to not be visible.
             * @example await expect(element(by.id('cancelButton'))).toBeNotVisible();
             * @deprecated Use `.not.toBeVisible()` instead.
             */
            toBeNotVisible(): R;

            /**
             * Expect the view to exist in the UI hierarchy.
             * @example await expect(element(by.id('okButton'))).toExist();
             */
            toExist(): R;

            /**
             * Expect the view to not exist in the UI hierarchy.
             * @example await expect(element(by.id('cancelButton'))).toNotExist();
             * @deprecated Use `.not.toExist()` instead.
             */
            toNotExist(): R;

            /**
             * Expect the view to be focused.
             * @example await expect(element(by.id('emailInput'))).toBeFocused();
             */
            toBeFocused(): R;

            /**
             * Expect the view not to be focused.
             * @example await expect(element(by.id('passwordInput'))).toBeNotFocused();
             * @deprecated Use `.not.toBeFocused()` instead.
             */
            toBeNotFocused(): R;

            /**
             * In React Native apps, expect UI component of type <Text> to have text.
             * In native iOS apps, expect UI elements of type UIButton, UILabel, UITextField or UITextViewIn to have inputText with text.
             * @example await expect(element(by.id('mainTitle'))).toHaveText('Welcome back!);
             */
            toHaveText(text: string): R;

            /**
             * Expects a specific accessibilityLabel, as specified via the `accessibilityLabel` prop in React Native.
             * On the native side (in both React Native and pure-native apps), that is equivalent to `accessibilityLabel`
             * on iOS and contentDescription on Android. Refer to Detox's documentation in order to learn about caveats
             * with accessibility-labels in React Native apps.
             * @example await expect(element(by.id('submitButton'))).toHaveLabel('Submit');
             */
            toHaveLabel(label: string): R;

            /**
             * In React Native apps, expect UI component to have testID with that id.
             * In native iOS apps, expect UI element to have accessibilityIdentifier with that id.
             * @example await expect(element(by.text('Submit'))).toHaveId('submitButton');
             */
            toHaveId(id: string): R;

            /**
             * Expects a toggle-able element (e.g. a Switch or a Check-Box) to be on/checked or off/unchecked.
             * As a reference, in react-native, this is the equivalent switch component.
             * @example await expect(element(by.id('switch'))).toHaveToggleValue(true);
             */
            toHaveToggleValue(value: boolean): R;

            /**
             * Expect components like a Switch to have a value ('0' for off, '1' for on).
             * @example await expect(element(by.id('temperatureDial'))).toHaveValue('25');
             */
            toHaveValue(value: any): R;

            /**
             * Expect Slider to have a position (0 - 1).
             * Can have an optional tolerance to take into account rounding issues on ios
             * @example await expect(element(by.id('SliderId'))).toHavePosition(0.75);
             * @example await expect(element(by.id('SliderId'))).toHavePosition(0.74, 0.1);
             */
            toHaveSliderPosition(position: number, tolerance?: number): Promise<void>;
        }

        interface WaitForFacade {
            /**
             * This API polls using the given expectation continuously until the expectation is met. Use manual synchronization with waitFor only as a last resort.
             * NOTE: Every waitFor call must set a timeout using withTimeout(). Calling waitFor without setting a timeout will do nothing.
             * @example await waitFor(element(by.id('bigButton'))).toExist().withTimeout(2000);
             */
            (element: NativeElement): Expect<WaitFor>;
        }

        interface WaitFor {
            /**
             * Waits for the condition to be met until the specified time (millis) have elapsed.
             * @example await waitFor(element(by.id('bigButton'))).toExist().withTimeout(2000);
             */
            withTimeout(millis: number): Promise<void>;

            /**
             * Performs the action repeatedly on the element until an expectation is met
             * @example await waitFor(element(by.text('Item #5'))).toBeVisible().whileElement(by.id('itemsList')).scroll(50, 'down');
             */
            whileElement(by: NativeMatcher): NativeElement & WaitFor;

            // TODO: not sure about & WaitFor - check if we can chain whileElement multiple times
        }

        interface NativeElementActions {
            /**
             * Simulate tap on an element
             * @param point relative coordinates to the matched element (the element size could changes on different devices or even when changing the device font size)
             * @example await element(by.id('tappable')).tap();
             * @example await element(by.id('tappable')).tap({ x:5, y:10 });
             */
            tap(point?: Point2D): Promise<void>;

            /**
             * Simulate long press on an element
             * @param duration (iOS only) custom press duration time, in milliseconds. Optional (default is 1000ms).
             * @example await element(by.id('tappable')).longPress();
             */
            longPress(duration?: number): Promise<void>;

            /**
             * Simulate long press on an element and then drag it to the position of the target element. (iOS Only)
             * @example await element(by.id('draggable')).longPressAndDrag(2000, NaN, NaN, element(by.id('target')), NaN, NaN, 'fast', 0);
             */
            longPressAndDrag(duration: number, normalizedPositionX: number, normalizedPositionY: number, targetElement: NativeElement,
                             normalizedTargetPositionX: number, normalizedTargetPositionY: number, speed: Speed, holdDuration: number): Promise<void>;

            /**
             * Simulate multiple taps on an element.
             * @param times number of times to tap
             * @example await element(by.id('tappable')).multiTap(3);
             */
            multiTap(times: number): Promise<void>;

            /**
             * Simulate tap at a specific point on an element.
             * Note: The point coordinates are relative to the matched element and the element size could changes on different devices or even when changing the device font size.
             * @example await element(by.id('tappable')).tapAtPoint({ x:5, y:10 });
             * @deprecated Use `.tap()` instead.
             */
            tapAtPoint(point: Point2D): Promise<void>;

            /**
             * Use the builtin keyboard to type text into a text field.
             * @example await element(by.id('textField')).typeText('passcode');
             */
            typeText(text: string): Promise<void>;

            /**
             * Paste text into a text field.
             * @example await element(by.id('textField')).replaceText('passcode again');
             */
            replaceText(text: string): Promise<void>;

            /**
             * Clear text from a text field.
             * @example await element(by.id('textField')).clearText();
             */
            clearText(): Promise<void>;

            /**
             * Taps the backspace key on the built-in keyboard.
             * @example await element(by.id('textField')).tapBackspaceKey();
             */
            tapBackspaceKey(): Promise<void>;

            /**
             * Taps the return key on the built-in keyboard.
             * @example await element(by.id('textField')).tapReturnKey();
             */
            tapReturnKey(): Promise<void>;

            /**
             * Scrolls a given amount of pixels in the provided direction, starting from the provided start positions.
             * @param pixels - independent device pixels
             * @param direction - left/right/up/down
             * @param startPositionX - the X starting scroll position, in percentage; valid input: `[0.0, 1.0]`, `NaN`; default: `NaN`—choose the best value automatically
             * @param startPositionY - the Y starting scroll position, in percentage; valid input: `[0.0, 1.0]`, `NaN`; default: `NaN`—choose the best value automatically
             * @example await element(by.id('scrollView')).scroll(100, 'down', NaN, 0.85);
             * @example await element(by.id('scrollView')).scroll(100, 'up');
             */
            scroll(
                pixels: number,
                direction: Direction,
                startPositionX?: number,
                startPositionY?: number
            ): Promise<void>;

            /**
             * Scroll to index.
             * @example await element(by.id('scrollView')).scrollToIndex(10);
             */
            scrollToIndex(
                index: Number
            ): Promise<void>;

            /**
             * Scroll to edge.
             * @param  edge - left|right|top|bottom
             * @param startPositionX - the X starting scroll position, in percentage; valid input: `[0.0, 1.0]`, `NaN`; default: `NaN`—choose the best value automatically
             * @param startPositionY - the Y starting scroll position, in percentage; valid input: `[0.0, 1.0]`, `NaN`; default: `NaN`—choose the best value automatically
             * @example await element(by.id('scrollView')).scrollTo('bottom', NaN, 0.85);
             * @example await element(by.id('scrollView')).scrollTo('top');
             */
            scrollTo(edge: Direction, startPositionX?: number, startPositionY?: number): Promise<void>;

            /**
             * Adjust slider to position.
             * @example await element(by.id('slider')).adjustSliderToPosition(0.75);
             */
            adjustSliderToPosition(newPosition: number): Promise<void>;

            /**
             * Swipes in the provided direction at the provided speed, started from percentage.
             * @param speed default: `fast`
             * @param percentage screen percentage to swipe; valid input: `[0.0, 1.0]`
             * @param optional normalizedStartingPointX X coordinate of swipe starting point, relative to the view width; valid input: `[0.0, 1.0]`
             * @param normalizedStartingPointY Y coordinate of swipe starting point, relative to the view height; valid input: `[0.0, 1.0]`
             * @example await element(by.id('scrollView')).swipe('down');
             * @example await element(by.id('scrollView')).swipe('down', 'fast');
             * @example await element(by.id('scrollView')).swipe('down', 'fast', 0.5);
             * @example await element(by.id('scrollView')).swipe('down', 'fast', 0.5, 0.2);
             * @example await element(by.id('scrollView')).swipe('down', 'fast', 0.5, 0.2, 0.5);
             */
            swipe(direction: Direction, speed?: Speed, percentage?: number, normalizedStartingPointX?: number, normalizedStartingPointY?: number): Promise<void>;

            /**
             * Sets a picker view’s column to the given value. This function supports both date pickers and general picker views. (iOS Only)
             * Note: When working with date pickers, you should always set an explicit locale when launching your app in order to prevent flakiness from different date and time styles.
             * See [here](https://wix.github.io/Detox/docs/api/device-object-api#9-launch-with-a-specific-language-ios-only) for more information.
             *
             * @param column number of datepicker column (starts from 0)
             * @param value string value in set column (must be correct)
             * @example
             * await expect(element(by.type('UIPickerView'))).toBeVisible();
             * await element(by.type('UIPickerView')).setColumnToValue(1,"6");
             * await element(by.type('UIPickerView')).setColumnToValue(2,"34");
             */
            setColumnToValue(column: number, value: string): Promise<void>;

            /**
             * Sets the date of a date-picker according to the specified date-string and format.
             * @param dateString Textual representation of a date (e.g. '2023/01/01'). Should be in coherence with the format specified by `dateFormat`.
             * @param dateFormat Format of `dateString`: Generally either 'ISO8601' or an explicitly specified format (e.g. 'yyyy/MM/dd'); It should
             *      follow the rules of NSDateFormatter for iOS and DateTimeFormatter for Android.
             * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
             * @example
             * await element(by.id('datePicker')).setDatePickerDate('2023-01-01T00:00:00Z', 'ISO8601');
             * await element(by.id('datePicker')).setDatePickerDate(new Date().toISOString(), 'ISO8601');
             * await element(by.id('datePicker')).setDatePickerDate('2023/01/01', 'yyyy/MM/dd');
             */
            setDatePickerDate(dateString: string, dateFormat: string): Promise<void>;

            /**
             * Triggers a given [accessibility action]{@link https://reactnative.dev/docs/accessibility#accessibility-actions}.
             * @param actionName - name of the accessibility action
             * @example await element(by.id('view')).performAccessibilityAction('activate');
             */
            performAccessibilityAction(actionName: string): Promise<void>

            /**
             * Pinches in the given direction with speed and angle. (iOS only)
             * @param angle value in radiant, default is `0`
             * @example
             * await expect(element(by.id('PinchableScrollView'))).toBeVisible();
             * await element(by.id('PinchableScrollView')).pinchWithAngle('outward', 'slow', 0);
             * @deprecated Use `.pinch()` instead.
             */
            pinchWithAngle(direction: PinchDirection, speed: Speed, angle: number): Promise<void>;

            /**
             * Pinches with the given scale, speed, and angle. (iOS only)
             * @param speed default is `fast`
             * @param angle value in radiant, default is `0`
             * @example
             * await element(by.id('PinchableScrollView')).pinch(1.1);
             * await element(by.id('PinchableScrollView')).pinch(2.0);
             * await element(by.id('PinchableScrollView')).pinch(0.001);
             */
            pinch(scale: number, speed?: Speed, angle?: number): Promise<void>;

            /**
             * Takes a screenshot of the element and schedules putting it in the artifacts folder upon completion of the current test.
             * For more information, see {@link https://wix.github.io/Detox/docs/api/screenshots#element-level-screenshots}
             * @param {string} name for the screenshot artifact
             * @returns {Promise<string>} a temporary path to the screenshot.
             * @example
             * test('Menu items should have logout', async () => {
             *   const imagePath = await element(by.id('menuRoot')).takeScreenshot('tap on menu');
             *   // The temporary path will remain valid until the test completion.
             *   // Afterwards, the screenshot will be moved, e.g.:
             *   // * on success, to: <artifacts-location>/✓ Menu items should have Logout/tap on menu.png
             *   // * on failure, to: <artifacts-location>/✗ Menu items should have Logout/tap on menu.png
             * });
             */
            takeScreenshot(name: string): Promise<string>;

            /**
             * Retrieves the OS-dependent attributes of an element.
             * If there are multiple matches, it returns an array of attributes for all matched elements.
             * For detailed information, refer to {@link https://wix.github.io/Detox/docs/api/actions-on-element/#getattributes}
             *
             * @example
             * test('Get the attributes for my text element', async () => {
             *    const attributes = await element(by.id('myText')).getAttributes()
             *    const jestExpect = require('expect');
             *    // 'visible' attribute available on both iOS and Android
             *    jestExpect(attributes.visible).toBe(true);
             *    // 'activationPoint' attribute available on iOS only
             *    jestExpect(attributes.activationPoint.x).toHaveValue(50);
             *    // 'width' attribute available on Android only
             *    jestExpect(attributes.width).toHaveValue(100);
             * })
             */
            getAttributes(): Promise<IosElementAttributes | AndroidElementAttributes | { elements: IosElementAttributes[] } | { elements: AndroidElementAttributes[] } >;
        }

        interface WebExpect<R = Promise<void>> {
            /**
             * Negate the expectation.
             * @example await expect(web.element(by.web.id('sessionTimeout'))).not.toExist();
             */
            not: this;

            /**
             * Expect the element content to have the `text` supplied
             * @param text expected to be on the element content
             * @example
             * await expect(web.element(by.web.id('checkoutButton'))).toHaveText('Proceed to check out');
             */
            toHaveText(text: string): R;

            /**
             * Expect the view to exist in the webview DOM tree.
             * @example await expect(web.element(by.web.id('submitButton'))).toExist();
             */
            toExist(): R;
        }

        interface IndexableWebElement extends WebElement {
            /**
             * Choose from multiple elements matching the same matcher using index
             * @example await web.element(by.web.hrefContains('Details')).atIndex(2).tap();
             */
            atIndex(index: number): WebElement;
        }

        interface WebElement extends WebElementActions {
        }

        interface WebElementActions {
            tap(): Promise<void>;

            /**
             * @param text to type
             * @param isContentEditable whether its a ContentEditable element, default is false.
             */
            typeText(text: string, isContentEditable: boolean): Promise<void>;

            /**
             * At the moment not working on content-editable
             * @param text to replace with the old content.
             */
            replaceText(text: string): Promise<void>;

            /**
             * At the moment not working on content-editable
             */
            clearText(): Promise<void>;

            /**
             * scrolling to the view, the element top position will be at the top of the screen.
             */
            scrollToView(): Promise<void>;

            /**
             * Gets the input content
             */
            getText(): Promise<string>;

            /**
             * Calls the focus function on the element
             */
            focus(): Promise<void>;

            /**
             * Selects all the input content, works on ContentEditable at the moment.
             */
            selectAllText(): Promise<void>;

            /**
             * Moves the input cursor / caret to the end of the content, works on ContentEditable at the moment.
             */
            moveCursorToEnd(): Promise<void>;

            /**
             * Running a JavaScript function on the element.
             * The first argument to the function will be the element itself.
             * The rest of the arguments will be forwarded to the JavaScript function as is.
             *
             * @param script a callback function in stringified form, or a plain function reference
             * without closures, bindings etc. that will be converted to a string.
             * @param args optional args to pass to the script
             *
             * @example
             * await webElement.runScript('(el) => el.click()');
             * await webElement.runScript(function setText(element, text) {
             *   element.textContent = text;
             * }, ['Custom Title']);
             */
            runScript(script: string, args?: unknown[]): Promise<any>;
            runScript<F>(script: (...args: any[]) => F, args?: unknown[]): Promise<F>;

            /**
             * Gets the current page url
             */
            getCurrentUrl(): Promise<string>;

            /**
             * Gets the current page title
             */
            getTitle(): Promise<string>;
        }

        type Direction = 'left' | 'right' | 'top' | 'bottom' | 'up' | 'down';

        type PinchDirection = 'outward' | 'inward'

        type Orientation = 'portrait' | 'landscape';

        type Speed = 'fast' | 'slow';

        interface LanguageAndLocale {
            language?: string;
            locale?: string;
        }

        /**
         *  Source for string definitions is https://github.com/wix/AppleSimulatorUtils
         */
        interface DevicePermissions {
            location?: LocationPermission;
            notifications?: NotificationsPermission;
            calendar?: CalendarPermission;
            camera?: CameraPermission;
            contacts?: ContactsPermission;
            health?: HealthPermission;
            homekit?: HomekitPermission;
            medialibrary?: MediaLibraryPermission;
            microphone?: MicrophonePermission;
            motion?: MotionPermission;
            photos?: PhotosPermission;
            reminders?: RemindersPermission;
            siri?: SiriPermission;
            speech?: SpeechPermission;
            faceid?: FaceIDPermission;
            userTracking?: UserTrackingPermission;
        }

        type BasicPermissionState = 'YES' | 'NO' | 'unset';
        type ExtendedPermissionState = 'YES' | 'NO' | 'unset' | 'limited';
        type LocationPermission = 'always' | 'inuse' | 'never' | 'unset';

        type CameraPermission = BasicPermissionState;
        type ContactsPermission = ExtendedPermissionState;
        type CalendarPermission = BasicPermissionState;
        type HealthPermission = BasicPermissionState;
        type HomekitPermission = BasicPermissionState;
        type MediaLibraryPermission = BasicPermissionState;
        type MicrophonePermission = BasicPermissionState;
        type MotionPermission = BasicPermissionState;
        type PhotosPermission = ExtendedPermissionState;
        type RemindersPermission = BasicPermissionState;
        type SiriPermission = BasicPermissionState;
        type SpeechPermission = BasicPermissionState;
        type NotificationsPermission = BasicPermissionState;
        type FaceIDPermission = BasicPermissionState;
        type UserTrackingPermission = BasicPermissionState;

        interface DeviceLaunchAppConfig {
            /**
             * Restart the app
             * Terminate the app and launch it again. If set to false, the simulator will try to bring app from background, if the app isn't running, it will launch a new instance. default is false
             */
            newInstance?: boolean;
            /**
             * Set runtime permissions
             * Grant or deny runtime permissions for your application.
             */
            permissions?: DevicePermissions;
            /**
             * Launch from URL
             * Mock opening the app from URL to test your app's deep link handling mechanism.
             */
            url?: any;
            /**
             * Launch with user notifications
             */
            userNotification?: any;
            /**
             * Launch with user activity
             */
            userActivity?: any;
            /**
             * Launch into a fresh installation
             * A flag that enables relaunching into a fresh installation of the app (it will uninstall and install the binary again), default is false.
             */
            delete?: boolean;
            /**
             * Arguments to pass-through into the app.
             * Refer to the [dedicated guide](https://wix.github.io/Detox/docs/api/launch-args) for complete details.
             */
            launchArgs?: Record<string, any>;
            /**
             * Launch config for specifying the native language and locale
             */
            languageAndLocale?: LanguageAndLocale;
        }

        // Element Attributes Shared Among iOS and Android
        interface ElementAttributes {
            /**
             * Whether or not the element is enabled for user interaction.
             */
            enabled: boolean;
            /**
             * The identifier of the element. Matches accessibilityIdentifier on iOS, and the main view tag, on Android - both commonly holding the component's test ID in React Native apps.
             */
            identifier: string;
            /**
             * Whether the element is visible. On iOS, visibility is calculated for the activation point. On Android, the attribute directly holds the value returned by View.getLocalVisibleRect()).
             */
            visible: boolean;
            /**
             * The text value of any textual element.
             */
            text?: string;
            /**
             * The label of the element. Largely matches accessibilityLabel for ios, and contentDescription for android.
             * Refer to Detox's documentation (`toHaveLabel()` subsection) in order to learn about caveats associated with
             * this property in React Native apps.
             */
            label?: string;
            /**
             * The placeholder text value of the element. Matches hint on android.
             */
            placeholder?: string;
            /**
             * The value of the element, where applicable.
             * Matches accessibilityValue, on iOS.
             * For example: the position of a slider, or whether a checkbox has been marked (Android).
             */
            value?: unknown;
        }

        interface IosElementAttributeFrame {
            y: number;
            x: number;
            width: number;
            height: number;
        }

        interface IosElementAttributeInsets {
            right: number;
            top: number;
            left: number;
            bottom: number;
        }

        // iOS Specific Attributes
        interface IosElementAttributes extends ElementAttributes {
            /**
             * The [activation point]{@link https://developer.apple.com/documentation/objectivec/nsobject/1615179-accessibilityactivationpoint} of the element, in element coordinate space.
             */
            activationPoint: Point2D;
            /**
             * The activation point of the element, in normalized percentage ([0.0, 1.0]).
             */
            normalizedActivationPoint: Point2D;
            /**
             * Whether the element is hittable at the activation point.
             */
            hittable: boolean;
            /**
             * The frame of the element, in screen coordinate space.
             */
            frame: IosElementAttributeFrame;
            /**
             * The frame of the element, in container coordinate space.
             */
            elementFrame: IosElementAttributeFrame;
            /**
             * The bounds of the element, in element coordinate space.
             */
            elementBounds: IosElementAttributeFrame;
            /**
             * The safe area insets of the element, in element coordinate space.
             */
            safeAreaInsets: IosElementAttributeInsets;
            /**
             * The safe area bounds of the element, in element coordinate space.
             */
            elementSafeBounds: IosElementAttributeFrame;
            /**
             * The date of the element (if it is a date picker).
             */
            date?: string;
            /**
             * The normalized slider position (if it is a slider).
             */
            normalizedSliderPosition?: number;
            /**
             * The content offset (if it is a scroll view).
             */
            contentOffset?: Point2D;
            /**
             * The content inset (if it is a scroll view).
             */
            contentInset?: IosElementAttributeInsets;
            /**
             * The adjusted content inset (if it is a scroll view).
             */
            adjustedContentInset?: IosElementAttributeInsets;
            /**
             * @example "<CALayer: 0x600003f759e0>"
             */
            layer: string;
        }

        // Android Specific Attributes
        interface AndroidElementAttributes extends ElementAttributes {
            /**
             * The OS visibility type associated with the element: visible, invisible or gone.
             */
            visibility: 'visible' | 'invisible' | 'gone';
            /**
             * Width of the element, in pixels.
             */
            width: number;
            /**
             * Height of the element, in pixels.
             */
            height: number;
            /**
             * Elevation of the element.
             */
            elevation: number;
            /**
             * Alpha value for the element.
             */
            alpha: number;
            /**
             * Whether the element is the one currently in focus.
             */
            focused: boolean;
            /**
             * The text size for the text element.
             */
            textSize?: number;
            /**
             * The length of the text element (character count).
             */
            length?: number;
        }
    }
}

export = Detox;
