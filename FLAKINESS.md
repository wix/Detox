> detox

# Dealing with flakiness in tests

## 1. We feel your pain

Flakiness is the greatest challenge in E2E. The good news is that detox was designed with this mission in mind: dealing with flakiness head on.

Assume you have a suite of 100 tests and each test is flaky in 0.5% of executions (failing without an actual bug in your app). The total flakiness of your entire suite is about 40% (the exact formula is `1 - (1 - 0.005)^100`). This means that there's 40% chance your suite will fail without an actual bug! This makes your entire suite useless.

## 2. Sources of flakiness

It's important to identify the various sources of flakiness in detox tests.

* Control of the device / simulator - in order to run your tests, detox must communicate with a simulator and instruct it to install the app, restart it, etc. Simulators don't always behave and controlling them might occasionally fail.

* More coming soon

## 3. Get more data about the problem

In order to identify the source of flakiness you're suffering from you need more data. If you catch a failing test that should be passing, you need to record as much information as possible in order to investigate.

* Enable verbose mode in detox. This will output a lot of information about what happening during the test.<br>To enable verbose mode run your tests like this:<br>`./node_modules/.bin/mocha e2e --opts ./e2e/mocha.opts --detoxVerbose`

* Collect the logs of detox-server. The server outputs logs to stdout, these logs show you how the tester and the testee communicate.
