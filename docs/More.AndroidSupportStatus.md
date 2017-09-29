# Android Support - Current Status

As we are wrapping up Android support for Detox, there's already a pretty hefty chunk of Detox for Android already implemented, we decided to start releasing it as we go along, just like we did with the iOS implementation.
This page should give an updated status of what's working and what's not (yet)...


## Setup & Configuration
Setup is not fully figured out yet, we want to make the setup with as little configuration as possible, and this will probably be last stage of the initial Android release.
If you want to test Detox for Android, you can read the configuration from the source, check out [demo-react-native](../examples/demo-react-native) for setup example.

1. You will need to add Detox library to your `build.gradle` and `settings.gradle`, and write one Test under `androidTest` directory, take a look at the provided example).
2. On React Native >0.46 is `newOkHttp`, on older versions, use `oldOkHttp`.

Of course, this example is not the final way we're going to package and ship Android support in the future, so expect breakage.

## Synchronization
Detox uses [Espresso's Idling Resource](https://developer.android.com/training/testing/espresso/idling-resource.html) mechanism to deeply sync with the app.
Most of the synchronization is working as expected on our RN test project.

For a technical reason related to React Native, Detox can not synchronize with native driver animations prior to RN 45.

## Core APIs (Matchers, Expectations, Actions)
Core APIs are implemented.

## Emulator control
1. **Emulators** are fully supported, to choose an emulator to run your tests on check `emulator -list-avds`. If non exist, create one.
2. **Devices** - Coming soon!
3. **Genymotion** -  Coming a bit later...

## Mocking
1. Deep Links - Done
2. User Notifications - Missing
3. Location - Coming soon

## Debugging
1. `--loglevel verbose` can give you pretty good insight on what going on.
2. `--debug-synchronization`, our tool to idnetify synchronization issues, is still missing

## Cross platform support
Detox is being developed on Macs, but there is no Mac specifc command on any of the Android drivers, or anything related to Android. Detox should work on both Linux and Windows.

## Documentation
Non, yet.
