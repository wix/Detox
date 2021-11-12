## Launch Arguments

In Detox, the app under test is launched via an explicit call to [`device.launchApp()`](APIRef.DeviceObjectAPI.md). Through various means, Detox enables specifying a set of user-defined arguments (key-value pairs) to be passed on to the app when launched, so as to make them available inside the launched app itself at runtime (both on the native side, and - if applicable, on the Javascript side).

### Motivation

> If this is clear to you first hand, you can skip right to the section about arguments setup.

In particular, the common use case of using launch argument (although not distinctly), is for [mocking](Guide.Mocking.md) external entities such as servers - replacing them with equivalent _mock servers_, sporting equivalent (yet fake) API-endpoints that run alongside the testing host (i.e. the one running Detox). These mock servers can typically be configured during the test, to return deterministic responses to network requests coming from the app.

Typically, the process of setting up such servers - especially in a parallel test-execution environment, involves three major steps (within the context of a test set-up):

1. Allocating a port for a mock server, dynamically.
2. Bringing up a mock server instance bound to that port (e.g. at `localhost:1234`).
3. Launching the app with a predefined argument that holds the port, for example `mockServerPort=1234`.
   (It is assumed here that there's designated mocked code inside the app that can read `mockServerPort` and rewire all connections to `localhost:1234` instead of to the real production server).

In this context, launch argument are useful for implementing step #3.

### Arguments Setup

User-defined launch arguments specification is very flexible, and can be defined on 4 levels:

| Level                                     | Description                                                  |
| ----------------------------------------- | ------------------------------------------------------------ |
| 1. Static Configuration                   | As a part of a static [Detox configuration](APIRef.Configuration.md), using the `launchArgs` property.<br />This is can sufficient, for example, if you only require one mock server instance, and can use the same static port throughout the entire testing execution session. |
| 2. Static via CLI                         | As arguments specified explicitly in the [command-line](APIRef.DetoxCLI.md) execution of `detox test`, using `--app-launch-args`. |
| 3.`device.appLaunchArgs`                  | Dynamically, using the [`device.appLaunchArgs`](APIRef.DeviceObjectAPI.md#deviceapplaunchargs) API, which initially holds the static configuration, and then allows for the modification of it before applied through `device.launchApp()`.<br/>Mostly required in complex test environments, where the servers and ports are dynamic, and are determined via distinct software components (e.g. separate test kits). |
| 4. `device.launchApp()` with `launchArgs` | Dynamically and explicitly, using on-site arguments specified in calls to [`device.launchApp()`](APIRef.DeviceObjectAPI.md#devicelaunchappparams) through the `launchArgs` parameter.<br />Ideal for fairly simple test environments, where the ports are dynamic but are in complete control of the user. |

**Important: Arguments specified in each level take precedence over equivalent underlying levels**.

Examples:

1. In an environment where `mockServerPort` is statically pre-set to `1001` in Detox configuration, and then set to to `1003` using `device.appLaunchArgs` inside a test, the app would eventually be launched with `1003` as its value, in calls to `device.launchApp()` in that test.
2. (Scenario continues) In subsequent calls to `device.launchApp()` with this parameter: `device.launchApp({ launchArgs: {mockServerPort: 1004} })`, the app will be (re-)launched with `1004` as the value for `mockServerPort`.

### In-App Arguments Access

On iOS, the specified launch arguments are passed as the process launch arguments and available through normal means.

On Android, the launch arguments are set as bundle-extra's into the activity's intent. It will therefore be accessible on the native side via the current activity as: `currentActivity.getIntent().getBundleExtra("launchArgs")`.

Further handling of these launch arguments is up to the user's responsibility and is out of scope for Detox.
