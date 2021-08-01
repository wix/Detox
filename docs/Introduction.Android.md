# Detox for Android

## Breaking Changes :warning:

**If you are installing Detox for Android for the first time, you can skip right over to the setup section.**

> Follow our [Migration Guide](Guide.Migration.md) for instructions on how to upgrade from older versions.

* **In version 11 we switched to using Android Espresso of Android's new [androidx.\*  support libraries](https://developer.android.com/jetpack/androidx/).** We did this in order to stay up to date with Google's latest features and bug fixes, in the hopes of using them to improve our own Android support (which gets better every day!).

* **In version 10, we've made [Kotlin](https://kotlinlang.org/) mandatory for integrating Detox into your Android project.** In the very least, you must include the Kotlin gradle plugin in your project, as we shall see later on. Nevertheless, this is a breaking change so bear that in mind when upgrading. In any case, worry not of the impact on your app, as - unless you effectively use Kotlin in your own native code, **there will be no impact on the final APK**, in terms of size and methods count.

* **As of version 7** we require Android gradle plugin 3.0.0 or newer. This is a breaking change that makes it impossible to support previous Android gradle plugin versions.

  https://developer.android.com/studio/build/gradle-plugin-3-0-0-migration.html

  For older Android gradle plugin support use `detox@6.x.x` instead ([previous setup guide here](https://github.com/wix/detox/blob/97654071573053def90e8207be8eba011408f977/docs/Introduction.Android.md)).

**Note: As a rule of thumb, we consider all old major versions discontinued; We only support the latest Detox major version.**

## Setup :gear:

### 1. Preliminary

Run through the basic steps of the [Getting Started guide](Introduction.GettingStarted.md), such as the environment and tools setup.

### 2. Apply Detox Configuration

Whether you've selected to apply the configuration in a  `.detoxrc.json` or bundle it into your project's `package.json` (under the `detox` section), this is what the configuration should roughly look like for Android:

```json
{
  "devices": {
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_28"
      }
    }
  },
  "apps": {
    "android.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .."
    },
    "android.release": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
      "build": "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd .."
    }
  },
  "configurations": {
    "android.emu.debug": {
      "device": "emulator",
      "app": "android.debug"
    },
    "android.emu.release": {
      "device": "emulator",
      "app": "android.release"
    }
  }
}
```

>For a comprehensive explanation of Detox configuration, refer to the [dedicated API-reference guide](APIRef.Configuration.md).

Pay attention to `-DtestBuildType`, set either to `debug` or `release` according to the main apk type.


Following device types could be used to control Android devices:

- `android.emulator`. Boot stock Android-SDK emulator (AVD) with provided `name`, for example `Pixel_API_28`.

- `android.attached`. Connect to already-attached android device. The device should be listed in the output of `adb devices` command under provided `name`.
  Use this type to connect to Genymotion emulator.
  The `avdName` property accepts a regular expression pattern that allows to specify the pool of device candidates to which you wish to connect. Use this property to run tests in parallel on multiple attached devices.

For a complete, working example, refer to the [Detox example app](/examples/demo-react-native/detox.config.js).

#### 2a. Using product flavors

If you are using custom [productFlavors](https://developer.android.com/studio/build/build-variants#product-flavors) the config needs to be applied a bit differently. This example shows how a `beta` product flavor would look for both debug and release build types:

```json
"detox" : {
  "devices": {
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_API_28"
      }
    }
  },
  "apps": {
    "android.beta.debug": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/beta/debug/app-beta-debug.apk",
      "build": "cd android && ./gradlew assembleBetaDebug assembleBetaDebugAndroidTest -DtestBuildType=debug && cd .."
    },
    "android.beta.release": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/beta/release/app-beta-release.apk",
      "build": "cd android && ./gradlew assembleBetaRelease assembleBetaReleaseAndroidTest -DtestBuildType=release && cd .."
    }
  },
  "configurations": {
    "android.emu.beta.debug": {
      "device": "emulator",
      "app": "android.beta.debug"
    },
    "android.emu.beta.release": {
      "device": "emulator",
      "app": "android.beta.release"
    }
  }
}
```

### 3. Add the Native Detox dependency

> **Starting Detox 12.5.0, Detox is shipped as a precompiled `.aar`.**
> To configure Detox as a _compiling dependency_, nevertheless -- refer to the _Setting Detox up as a compiling dependency_ section at the bottom.

In your *root* buildscript (i.e. `android/build.gradle`), register both `google()` _and_ detox as repository lookup points in all projects:

```groovy
// Note: add the 'allproject' section if it doesn't exist
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



In your app's buildscript (i.e. `android/app/build.gradle`) add this in `dependencies` section:

```groovy
dependencies {
	  // ...
    androidTestImplementation('com.wix:detox:+')
}
```

... and add this to the `defaultConfig` subsection:

```groovy
android {
  // ...
  
  defaultConfig {
      // ...
      testBuildType System.getProperty('testBuildType', 'debug')  // This will later be used to control the test apk build type
      testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
  }
}
```
Please be aware that the `minSdkVersion` needs to be at least 18.



### 4. Add Kotlin

If your project does not already support Kotlin, add the Kotlin Gradle-plugin to your classpath in the root build-script (i.e.`android/build.gradle`):

```groovy
buildscript {
    // ...
    ext.kotlinVersion = '1.3.0' // (check what the latest version is!)
    dependencies {
        // ...
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion"
    }
}
```

_Note: most guides advise of defining a global `kotlinVersion` constant - as in this example, but that is not mandatory._

***Note that Detox has been tested for version 1.1.0 of Kotlin, and higher!***

### 5. Create a Detox-Test Class

Detox requires a dummy implementation of a single Android-native test.

1. Add a new file to your project, under this path and name: `android/app/src/androidTest/java/com/[your.package]/DetoxTest.java`. **Double-check that the path is correct!**
2. Copy & paste the content of the equivalent file from [the detox example app for RN](../examples/demo-react-native/android/app/src/androidTest/java/com/example/DetoxTest.java), into it. **Don't forget to change the package name to your project's package name!**


### 6. Enable clear-text (unencrypted) traffic for Detox

Starting Android SDK v28, Google have disabled all clear-text network traffic by default. Namely, unless explicitly configured, all of your application's outgoing unencrypted traffic (i.e. non-TLS using HTTP rather than HTTPS) is blocked by the device.

For Detox to work, Detox test code running on the device must connect to the test-running host through it's virtual localhost interface<sup>(*)</sup> using simple HTTP traffic. Therefore, the following network-security exemption configuration must be applied --

*In an xml resource file, e.g. `android/app/src/main/res/xml/network_security_config.xml`:*

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

*In the app's `AndroidManifest.xml`*

```xml
<manifest>
  <application 
        ...
        android:networkSecurityConfig="@xml/network_security_config">
  </application>
</manifest>
```

> *Refer to the [Detox example app](https://github.com/wix/Detox/tree/master/examples/demo-react-native/android/app/src/main) for an example on how this is effectively implemented.* 

**Note: if properly configured, this in no way compromises the security settings of your app.**

For full details, refer to [Android's security-config guide](https://developer.android.com/training/articles/security-config), and the dedicated article in the [Android developers blog](https://android-developers.googleblog.com/2016/04/protecting-against-unintentional.html). 

> *(\*) 10.0.2.2 for Google emulators, 10.0.3.2 for Genymotion emulators.*



### 7. Proguard (Minification, Obfuscation)

In apps running [minification using Proguard](https://developer.android.com/studio/build/shrink-code), in order for Detox to work well on release builds, please enable some Detox proguard-configuration rules by applying the custom configuration file on top of your own. Typically, this is defined using the `proguardFiles` statement in the minification-enabled build-type in your `app/build.gradle`:

```groovy
    buildTypes {
        // 'release' is typically the default proguard-enabled build-type
        release {
            minifyEnabled true

            // Typical pro-guard definitions
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            // Detox-specific additions to pro-guard
            proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
        }
    }

```

:warning: **Note:** In order for Detox to be able to work properly, in `proguard-rules-app.pro`, it effectively declares rules that retain most of React-Native's code (i.e. keep it unminified, unobfuscated) in your **production** APK. Though generally speaking, this should not be an issue (as React-Native is an open-source project), there are ways around that, if it bothers you. For example, running your E2E over a build-type specifically designed to run E2E tests using Detox would do the trick -- roughly, like so (in `app/build.gradle`):

```groovy
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'

            signingConfig signingConfigs.release
        }
        releaseE2E {
            initWith release
            setMatchingFallbacks('release')

            proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
        }
    }
```

Here we utilize Gradle's `initWith` to easily define `releaseE2E` in a way that is identical to the `release` build-type, with the exception of considering Detox' `proguard-rules-app.pro` in the minification process.

Following the example, you would then have to build your app using `gradlew assembleReleaseE2E` rather than `gradlew assembleRelease` before running Detox, and instruct Detox (i.e. via `binaryPath` in the Detox configuration file) to use the APK resulted specifically by *that* Gradle target (e.g. in `app/build/apk/releaseE2E/app-releaseE2E.apk` instead of the equivalent `app/build/apk/release/app-release.apk`).

> Note: if you app contains flavours -- that makes things a bit trickier, but the approach can generally be adjusted to support that as well.

**Last but not least:** If you're having issue with Detox' Proguard rules, please report them [here](https://github.com/wix/Detox/issues/new/choose).
A special thanks to [GEllickson-Hover](https://github.com/GEllickson-Hover) for reporting issues related to obfuscation in [#2431](https://github.com/wix/Detox/issues/2431).

### 8. Test Butler Support (Optional)

If, when [setting up your work environment](Introduction.AndroidDevEnv.md), you've selected Google emulators with an AOSP image as the test target - as recommended, **we strongly encourage** you would also integrate [Test Butler](https://github.com/linkedin/test-butler): in the very least - in order to suppress crash & ANR's dialogs. They are a soft spot in UI testing on Android, all around, as - when displayed, they make the UI entirely inaccessible (and thus cause tests to fail in bulks).

Setting Test Butler up for working with Detox is a bit different than explained in their guides. The process, as a whole, is twofold:

1. Preinstalling the test-butler-app APK onto the test device.
2. Integrating the test-butler-lib into your own test APK, and initializing it in a custom test-runner (as explained).

The library part can be easily achieved as explained there (i.e. by using Gradle's `androidTestImplementation`). Same goes for initialization. As for the APK, the suggested usage of Gradle's `androidTestUtil` is scarce when running with Detox (i.e. non-native instrumentation tests). Here's what to do instead.

#### Solution 1: Prebaked Images

If you have control over the emulators' snapshots, simply download (see test-butler's guide) and install the test-butler APK once (e.g. use `adb install -r -t path/to/test-butler-app.apk`), and save an updated version of the snapshot. This is the best solution.

> Note: you will have to reiterate this if you upgrade to a newer version of Test-Butler, in the future.

#### Solution 2: Dynamic Installation

Assuming you have the APK available in the system, you can dynamically have Detox automatically install it in all of the running target-emulators by utilizing `utilBinaryPaths` in your Detox configuration. Example:

```json
{
  "devices": {
    "emulator.oss": {
      "type": "android.emulator",
      "device": "...",
      "utilBinaryPaths": ["relative/path/to/test-butler-app-2.2.1.apk"],
    }
  }
}
```

> Refer to our [configuration guide](APIRef.Configuration.md) for further details on `utilBinaryPaths`.

As per _making_ the APK available - for that, we have no really good solution, for the time being (but it's in the works). A few options might be:

a. In a custom script, have it predownloaded from Maven directly, as suggested in the Test Butler guide. For example (on a Mac / Linux):

```sh
curl -f -o ./temp/test-butler-app.apk https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/2.2.1/test-butler-app-2.2.1.apk
```

*Jests' [global-setup](https://jestjs.io/docs/en/configuration#globalsetup-string) is a recommend place for those kind of things.*

> Should you decide to go this path, we recommend you add `./temp/test-butler-app.apk` to the relevant `.gitignore`.

b. (Discouraged) Add it to your source control (e.g. git), as part of the repository.

## Setting Detox up as a compiling dependency

This is an **alternative** to the setup process described under the previous section, on adding Detox as a dependency.



In your project's `settings.gradle` add:

```groovy
include ':detox'
project(':detox').projectDir = new File(rootProject.projectDir, '../node_modules/detox/android/detox')
```



In your *root* buildscript (i.e. `android/build.gradle`), register `google()` as a repository lookup point in all projects:

```groovy
// Note: add the 'allproject' section if it doesn't exist
allprojects {
    repositories {
        // ...
        google()
    }
}
```



In your app's buildscript (i.e. `android/app/build.gradle`) add this in `dependencies` section:

```groovy
dependencies {
  	// ...
    androidTestImplementation(project(path: ":detox"))
}
```



In your app's buildscript (i.e. `android/app/build.gradle`) add this to the `defaultConfig` subsection:

```groovy
android {
  // ...
  
  defaultConfig {
      // ...
      testBuildType System.getProperty('testBuildType', 'debug')  // This will later be used to control the test apk build type
      testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'
      missingDimensionStrategy 'detox', 'full'
  }
}
```

Please be aware that the `minSdkVersion` needs to be at least 18.



## Troubleshooting

Please refer to [troubleshooting guide about build issues](Troubleshooting.BuildingTheApp.md#android) for assistance.

