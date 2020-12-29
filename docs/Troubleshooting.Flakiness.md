# Dealing With Flakiness in Tests

> What is a flaky test?

A flaky test is a test that passes most of the time, and sometimes without any appearant reason and without any changes to your app - it fails. This can even happen only on certain machines. For example, on your own machine it always passes, but on a different slower machine, like the CI, it fails.

### 1. We Feel Your Pain

Flakiness is the greatest challenge in E2E. The good news is that Detox was designed with this mission in mind: dealing with flakiness head on.

Assume you have a suite of 100 tests and each test is flaky in 0.5% of executions (failing without an actual bug in your app). The total flakiness of your entire suite is about 40% (the exact formula is `1 - (1 - 0.005)^100`). This means that there's 40% chance your suite will fail without an actual bug! This makes your entire suite useless.

### 2. Sources of Flakiness

It's important to identify the various sources of flakiness in Detox tests.

* Control of the device / simulator - in order to run your tests, Detox must communicate with a simulator and instruct it to install the app, restart it, etc. Simulators don't always behave and controlling them might occasionally fail. Detox's underlying simulator control is [`AppleSimulatorUtils`](https://github.com/wix/AppleSimulatorUtils), it is a tool that supports both basic and advanced simulator and device interaction options, it uses some core simulator features which are not always stable and may need time to "warm up" (booting, shutting down, etc.). Detox is set to have a few retries on any of these actions before failing. It will also print all the `exec` commands when using `verbose` log level, and with `trace` level it will print everything.

* Asynchronous operations inside your app - every time an E2E test runs, operations might take place in a different order inside your app. This makes E2E tests nondeterministic. Consider an HTTP request made to a server, this request may take a variable time to complete due to external concerns like network congestion and server load. Detox takes this into account by monitoring all asynchronous operations that take place in your app from the inside. Detox knows which network requests are currently in-flight. Detox knows how busy the React Native bridge is. Tests are automatically synchronized to the app and only move forward when the app is idle.

### 3. Get More Data About the Problem

In order to identify the source of flakiness you're suffering from you need more data. If you catch a failing test that should be passing, you need to record as much information as possible in order to investigate.

* Enable `trace` mode in Detox. This will output a lot of information about what happening during the test.
	1. `exec` commands
	2. All communication going over the websocket, both from tester and app

To enable `trace` mode run your tests in trace log mode:

```sh
detox test --loglevel trace
```
