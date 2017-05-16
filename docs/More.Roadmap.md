# Roadmap to detox

We have some very intersting plans for detox, this is the place where we'll share them.

### Android support
The current API supports addition of multiple platforms, Android is next. This is the biggest feature we'll be working on in the near future. Supporting both Android emulators and devices. Our plan is to use both Espresso and UIAutomator as drivers. Espresso for core in-app interactions and syncronization with react-native, and UIAutomator for peripherals (notification panel, permission dialogs etc.). This will grant us both the speed and percision of Espresso, and the flexibility of UIAutomator.

### iOS device support
Currently detox only supports running on iOS simulators, we plan on adding support for running on devices as well.

### Expectations on device logs
One of our most wanted features, being able to assert log outputs.

### Performance probing
Maintaining performance is hard, The main issue with it is that by the time you notice there's a degredation in performance there's already so much changed it's hard to find which change made this regression (probably many small ones). Just like in BI, you won’t know if your change degrades or improves performance unless measure for it, or if there’s a tool to help you. 

* **Measure vital signs while running tests.** 
E2E is the perfect environment to measure, tests are actually running on a device, like in the real world.
* **Set threshold for measurements.**
Expect your E2E scenario to use a specific amount of resources.
* **Compare measurements to previous builds.**
Know exactly when the regression have happened

#### (Partial) list of measurments we'd like to have:
network bandwidth/calls, thread count, js thread cpu ticks, memory cpu, size on disk, binary size, react component render count, message count on the bridge, disk I/O


### Failed test artifacts

Add the following to an artifact directory for each failed test

1. Video of the test from start to finish
2. Device log
3. Print hierarchy with testIDs