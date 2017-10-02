# Android Support - Current Status

As we are wrapping up Android support for Detox, there's already a pretty hefty chunk of Detox for Android already implemented, we decided to start releasing it as we go along, just like we did with the iOS implementation.
This page should give an updated status of what's working and what's not (yet)...


## Setup & Configuration
Setup is not fully figured out yet, we want to make the setup with as little configuration as possible, and this will probably be the last stage of the initial Android release.

### Short version
- Update to the latest Detox.
- Detox Android shipped in source code in `node_modules/detox`.
- Add the detox Android project as a androidTestCompile dependency.
- Add an androidTest type test to your test suite.

```
androidTestCompile(project(path: ":detox", configuration: "oldOkhttpDebug"), {
   exclude group: 'com.android.support', module: 'support-annotations'
})
```

### Longer version

Detox Android is a standard Android integration test. Although, it is completely asynchronous.
It uses Espresso internally, therefore you have to use an AndroidJUnitRunner as your test runner (or a subclass of it).

```
android {
    defaultConfig {
        testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
    }
}
```

The whole setup needs only a few lines of code.

Please take a look at the [demo-react-native](../examples/demo-react-native) project to see a full example of how to add it to your project.
You must copy a few lines from settings.gradle, build.gradle, and DetoxTest.java.

In case your project's RN version is at least 0.46.0 change the `oldOkhttp` string to `newOkhttp`, in the `app/build.gradle` [here.](../examples/demo-react-native/android/app/build.gradle#L65)

Of course, this example is not the final way we're going to package and ship Android support in the future, so expect breakage.

Detox test is a NO-OP in case it's not triggered by detox itself. So, it's safe to add it to your existing test suite.

## Synchronization
Detox uses [Espresso's Idling Resource](https://developer.android.com/training/testing/espresso/idling-resource.html) mechanism to deeply sync with the app.
Most of the synchronization is working as expected on our RN test project.

One of the advantage of using standard tools like Epsresso is that you can register your own Idling Resource and Detox will respect it.

For a technical reason related to React Native, Detox can not synchronize with native driver animations prior to RN 45.

## Core APIs (Matchers, Expectations, Actions)
All Core APIs are 100% implemented.

## Emulator control
1. **Emulators** are fully supported, to choose an emulator to run your tests on check `emulator -list-avds`. If none exist, create one.
2. **Devices** - Coming soon!
3. **Genymotion** -  Coming a bit later...

## Mocking
1. Deep Links - Done
2. User Notifications - Missing
3. Location - Coming soon

## Debugging
1. `--loglevel verbose` can give you pretty good insight on what going on.
2. `--debug-synchronization`, our tool to identify synchronization issues, is still missing

## Cross platform support
Detox is being developed on Macs, but there is no Mac specifc command on any of the Android drivers, or anything related to Android. Detox should work on both Linux and Windows.

## Differences between iOS and Android
- Detox Android doesn't wait for Timers scheduled less than 1.5sec in the future. Its look ahead threshold is only 15ms.
- Contrary to iOS, synchronization can not be completely turned off by [device.disablesynchronization()](https://github.com/wix/detox/blob/master/docs/APIRef.DeviceObjectAPI.md#devicedisablesynchronization). It turns off only the monitoring of the network. This feature will never be fully implemented as Espresso syncs can not be turned off completely. Atlhough, Animation sync might be added to this later.
- Detox Android doesn't wait for delayed animations. (iOS waits for 1.5sec for delayed animations)

## General remarks
- Infinite animations (looped animations) can make detox wait forever currently. Please consider turning them off for testing. It's also a good practice to speed up all animations for testing.
