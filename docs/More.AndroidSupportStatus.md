# Android Support - Status Page

> The content in this page is out of date. We apologize, and hope to have it updated soon.

As we are wrapping up Android support for Detox, there's already a pretty hefty chunk of Detox for Android already implemented, we decided to start releasing it as we go along, just like we did with the iOS implementation.

This page should give an updated status of what's working and what's not (yet)...

## Setup & Configuration
Setup is not fully figured out yet. Our goal is to make it dead simple for pure React Native projects. We are not there yet.

### Step by Step Guide

For a step by step guide, check out [Introduction.Android](Introduction.Android.md).

### High Level Overview

- Update to the latest Detox.
- Detox Android is shipped in source code in `node_modules/detox`.
- Add the detox Android project as an androidTestCompile dependency.
- Add an integration test case to your test suite. [Example.](../examples/demo-react-native/android/app/src/androidTest/java/com/example/DetoxTest.java)

```gradle
androidTestCompile(project(path: ":detox", configuration: "oldOkhttpDebug"), {
   exclude group: 'com.android.support', module: 'support-annotations'
})
```

### Details

Detox Android is a standard Android integration test with many twists. For example, it is completely asynchronous. The test cases are not compiled, they come through a websocket from the JS test runner via a json protocol. They are evaluated inside the app and the result along with a possible debug informations are sent back to the JS test runner.

It uses Espresso internally, therefore you must use an AndroidJUnitRunner as your test runner (or a subclass of it).

```gradle
android {
    defaultConfig {
        testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
    }
}
```

Please take a look at the [demo-react-native](../examples/demo-react-native) project to see a minimal project set up for Android. If you want to browse a more complex example you can take a look at detox's internal test suite [here.](https://github.com/wix/detox/tree/master/detox/test/e2e)

## Hybrid apps

Detox test is a NO-OP in case it's not triggered by detox itself. So, it's safe to add it to your existing test suite.

## Synchronization
Detox uses [Espresso's Idling Resource](https://developer.android.com/training/testing/espresso/idling-resource.html) mechanism to deeply sync with the app.

One of the advantage of using standard tools like Espresso is that you can register your own Idling Resources and Detox will fully respect them. Just register them in the Detox instrumentation test case before calling `Detox.runTests(...)`.

## Core APIs (Matchers, Expectations, Actions)
All Core APIs are 100% implemented.

## Emulator control
1. **Emulators** are fully supported, to choose an emulator to run your tests on check `emulator -list-avds`. If none exist, create one.
2. **Devices** - Coming soon!
3. **Genymotion**
To utilize Genymotion you should use 'android.attached' as configuration type parameter and Genymotion emulator name as configuration name parameter. For example,

```json
"android": {
    "binaryPath": "./android/app/build/outputs/apk/app-debug.apk",
    "build": "pushd ./android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && popd",
    "type": "android.attached",
    "device": {
      "adbName": "192.168.57.101:5555"
    }
}
```

Type 'android.attached' could be used to connect to any of already attached devices that are visible through 'adb devices' command.

## Mocking
1. Deep Links - Done
2. User Notifications - Missing
3. Location - Coming soon

## Debugging
1. `--loglevel trace` can give you pretty good insight on what going on.
2. `--debug-synchronization [ms]`, our tool to identify synchronization issues works on Android too.

## Cross Platform Support

Detox is being developed on Macs, but there is no Mac specific command on any of the Android drivers, or anything related to Android. Detox should work on both Linux and Windows.

## Differences Between iOS and Android

- Detox Android doesn't wait for Timers scheduled less than 1.5sec in the future. Its look ahead threshold is only 15ms.
- Contrary to iOS, synchronization can not be completely turned off by [device.disablesynchronization()](https://github.com/wix/detox/blob/master/docs/APIRef.DeviceObjectAPI.md#devicedisablesynchronization). It turns off only the monitoring of the network operation at the moment. This feature will never be fully implemented as Espresso syncs can not be turned off completely. It is planned to tie the Animation synchronization too to it.
- Detox Android doesn't wait for delayed animations. (iOS waits for 1.5sec for delayed animations)
- Please be aware that the order of the elements using the `atIndex()` API can be different between the two platforms. You can use the `getPlatform()` API to use different indexes in your tests. See below.

## General Remarks

- For a technical reason related to React Native, Detox can not synchronize with native driver animations prior to RN 45.
- Infinite animations (looped animations) can make detox wait forever. Please consider turning looped animations off for testing. It's also a good practice to speed up all animations for testing.
- With the addition of Android we introduced an API to be able to differentiate between the two platforms in your test cases.

```js
if (device.getPlatform() === 'ios') {
   await expect(loopSwitch).toHaveValue('1');
}
```
