---
id: Introduction.Android
title: Detox for Android
---

## Breaking Changes :warning:

> If you are installing Detox for Android for the first time, you can skip right over to the setup section.

> Follow our [Migration Guide](Guide.Migration.md) for instructions on how to upgrade from older versions.

* **In version 11 we switched to using Android Espresso of Android's new [androidx.\*  support libraries](https://developer.android.com/jetpack/androidx/).** We did this in order to stay up to date with Google's latest features and bug fixes, in the hopes of using them to improve our own Android support (which gets better every day!).

* **In version 10, we've made [Kotlin](https://kotlinlang.org/) mandatory for integrating Detox into your Android project.** In the very least, you must include the Kotlin gradle plugin in your project, as we shall see later on. Nevertheless, this is a breaking change so bear that in mind when upgrading. In any case, worry not of the impact on your app, as - unless you effectively use Kotlin in your own native code, **there will be no impact on the final APK**, in terms of size and methods count.

* **As of version 7** we require Android gradle plugin 3.0.0 or newer. This is a breaking change that makes it impossible to support previous Android gradle plugin versions.

  https://developer.android.com/studio/build/gradle-plugin-3-0-0-migration.html

  For older Android gradle plugin support use `detox@6.x.x` instead ([previous setup guide here](https://github.com/wix/detox/blob/97654071573053def90e8207be8eba011408f977/docs/Introduction.Android.md)).<br>

  **Note: As a rule of thumb, we consider all old major versions discontinued; We only support the latest Detox major version.**

## Setup :gear:
### 1. Run through the initial _Getting Started_ Guide

- [Getting Started](Introduction.GettingStarted.md)

### 2. Add Detox dependency to an Android project

In your *root* buildscript (i.e. `build.gradle`), register both `google()` _and_ detox as repository lookup points:

```groovy
allprojects {
    repositories {
        // ...
        google()
        maven {
            // All of Detox' artifacts are provided via the npm module
            url "$rootDir/../node_modules/detox/Detox-android"
        }
    }
}

```



In `android/app/build.gradle` add this to `defaultConfig` section:

```groovy
  defaultConfig {
      // ...
      testBuildType System.getProperty('testBuildType', 'debug')  // This will later be used to control the test apk build type
      testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
      // ...
  }
```
Please be aware that the `minSdkVersion` needs to be at least 18.




In your app's buildscript (i.e. `app/build.gradle`) add this in `dependencies` section:

```groovy
dependencies {
	  // ...
    androidTestImplementation('com.wix:detox:+') { transitive = true } 
    androidTestImplementation 'junit:junit:4.12'
}
```

### 3. Add Kotlin

If your project does not already use Kotlin, add the Kotlin Gradle-plugin to your classpath in `android/build.gradle`:

```groovy
buildscript {
    // ...
    ext.kotlinVersion = '1.3.0'
    
    dependencies: {
        // ...
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}
```

_Note: most guides advise of defining a global `kotlinVersion` constant - as in this example, but that is not mandatory._


**IMPORTANT:** Detox aims at a playing fair with your app, and so it allows you to explicitly define the kotlin version for it to use - so as to align it with your own; Please do so - in your root `android/build.gradle` configuration file:

```groovy
buildscript {
    ext.kotlinVersion = '1.3.0' // Your app's version
    ext.detoxKotlinVersion = ext.kotlinVersion // Detox' version: should be 1.1.0 or higher!
}
```

***Note that Detox has been tested for version 1.1.0 of Kotlin, and higher!***

### 4. Create Android Test class

Add the file `android/app/src/androidTest/java/com/[your.package]/DetoxTest.java` and fill as in [the detox example app for NR](../examples/demo-react-native/android/app/src/androidTest/java/com/example/DetoxTest.java). **Don't forget to change the package name to your project's**.

### 5. Add Android configuration

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

### 6. Run the tests

Using the `android.emu.debug` configuration from above, you can invoke it in the standard way.

```sh
detox test -c android.emu.debug
```

## Proguard (Minification)

In apps running [minification using Proguard](https://developer.android.com/studio/build/shrink-code), in order for Detox to work well on release builds, please enable some Detox proguard-configuration rules by applying the custom configuration file on top of your own. Typically, this is defined using the `proguardFiles` statement in the minification-enabled build-type in your `app/build.gradle`:

```groovy
    buildTypes {
        // 'release' is typically the default proguard-enabled build-type
        release {
            minifyEnabled true

            // Typical pro-guard definiotns
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            // Detox-specific additions to pro-guard
            proguardFile new File(rootProject.projectDir, '../node_modules/detox/android/detox/proguard-rules-app.pro')
        }
    }

```



## Troubleshooting

### Problem: `Duplicate files copied in ...`

If you get an error like this:

```sh
Execution failed for task ':app:transformResourcesWithMergeJavaResForDebug'.
> com.android.build.api.transform.TransformException: com.android.builder.packaging.DuplicateFileException: Duplicate files copied in APK META-INF/LICENSE
```

You need to add this to the `android` section of your `android/app/build.gradle`:

```groovy
packagingOptions {
    exclude 'META-INF/LICENSE'
}
```
