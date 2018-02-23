---
id: version-7.X-Introduction.Android
title: Detox for Android
original_id: Introduction.Android
---

## Setup
Detox 7 was updated to support Android gradle plugin 3.0.0. This is a breaking change that makes it impossible to support previous Android gradle plugin versions.

https://developer.android.com/studio/build/gradle-plugin-3-0-0-migration.html

For older Android gradle plugin support use `detox@6.x.x` instead ([previous setup guide here](https://github.com/wix/detox/blob/97654071573053def90e8207be8eba011408f977/docs/Introduction.Android.md)).<br>
**Detox 6 will not continue to be updated, to continue getting updates and features, update your Android gradle config and migrate to Detox 7.**

### 1. Do the initial setup described in the Getting Started Guide

- [Getting Started](Introduction.GettingStarted.md)

### 2. Add Detox dependency to an Android project

In `android/settings.gradle` add:

```gradle
include ':detox'
project(':detox').projectDir = new File(rootProject.projectDir, '../node_modules/detox/android/detox')
```

In `android/app/build.gradle` add this to `defaultConfig` section:

```gradle
  defaultConfig {
      ...
      testBuildType System.getProperty('testBuildType', 'debug')  //this will later be used to control the test apk build type
      missingDimensionStrategy "minReactNative", "minReactNative46" //read note
      testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
      ...
  }
```
Please be aware that the `minSdkVersion` needs to be at least 18.

> ###### Choosing the right build type (in missingDimensionStrategy)
>Detox runs on multiple React Native versions, choose the correct build type to support the version you use.<br>
>**Available versions:**
>
>* `minReactNative44`: Support for React Native 0.44-0.45
>* `minReactNative46`: Support for React Native 0.46+


In `android/app/build.gradle` add this in `dependencies` section:

```gradle
dependencies {
	...
    androidTestImplementation(project(path: ":detox"))
    androidTestImplementation 'junit:junit:4.12'
    androidTestImplementation 'com.android.support.test:runner:1.0.1'
    androidTestImplementation 'com.android.support.test:rules:1.0.1'
    ...
}
```

And in the same file you need to add this under `allprojects > repositories`:

```gradle
buildscript {
    repositories {
	     ...
        google()
        ...
    }
}
```

### 3. Create Android Test class

You need to add the file `android/app/src/androidTest/java/com/[your.package]/DetoxTest.java` and fill it like [this](../detox/test/android/app/src/androidTest/java/com/example/DetoxTest.java), expect that you need to change the package to your projects name.

### 4. Add Android configuration

Add this part to your `package.json`:

```json
"detox" : {
    "configurations": {
        "android.emu.debug": {
            "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
            "build":
            "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
            "type": "android.emulator",
            "name": "Nexus_5X_API_24"
        },
        "android.emu.release": {
            "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
            "build":
            "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..",
            "type": "android.emulator",
            "name": "Nexus_5X_API_26"
        }
    }
}
```
Pay attention to `-DtestBuildType`, set either to `debug` or `release` according to the main apk type.


Following device types could be used to control Android devices:

`android.emulator`. Boot stock SDK emulator with provided `name`, for example `Nexus_5X_API_25`. After booting connect to it.

`android.attached`. Connect to already-attached android device. The device should be listed in the output of `adb devices` command under provided `name`.
Use this type to connect to Genymotion emulator.

### 5. Run the tests

Using the `android.emu.debug` configuration from above, you can invoke it in the standard way.

```sh
detox test -c android.emu.debug
```

## Troubleshooting

### Problem: `Duplicate files copied in ...`

If you get an error like this:

```sh
Execution failed for task ':app:transformResourcesWithMergeJavaResForDebug'.
> com.android.build.api.transform.TransformException: com.android.builder.packaging.DuplicateFileException: Duplicate files copied in APK META-INF/LICENSE
```

You need to add this to the `android` section of your `android/app/build.gradle`:

```gradle
packagingOptions {
    exclude 'META-INF/LICENSE'
}
```
