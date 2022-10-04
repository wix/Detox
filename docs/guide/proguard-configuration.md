# ProGuard configuration

:::tip

You can skip this guide if you are working solely with debug builds (`android.emu.debug`, etc.),
but as soon as you move to the **release builds**, where the native code gets minified and obfuscated,
you are going to have problems with Detox if you leave your ProGuard rules not configured.

:::

Since Detox relies on
[Android Reflection API](https://developer.android.com/reference/java/lang/reflect/package-summary)
to integrate with React Native on Android, you should keep [ProGuard minification](https://developer.android.com/studio/build/shrink-code)
under tight control. Otherwise, you’ll be seeing Detox crashing or hanging up infinitely upon an attempt to
run tests with your app built in **release mode**.

To fix that, you’d need to return to your app build script:

```diff title="app/build.gradle"
     buildTypes {
     …
// highlight-next-line
         release {
             minifyEnabled true

// highlight-next-line
             proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
// highlight-next-line
+            proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
         }
     }
```

1. `release` build type is usually expected to have ProGuard enabled
1. Typical pro-guard definitions. Check out Android docs to get to know more.
1. Detox-specific additions to pro-guard

:warning: **Note:** In order for Detox to be able to work properly, in `proguard-rules-app.pro`,
it effectively declares rules that retain most of React-Native’s code
(i.e. keep it unminified, unobfuscated) in your **production** APK.

Though generally speaking, this should not be an issue (as React-Native is an open-source project),
there are ways around that, if it bothers you.
For example, running your E2E over a build-type specifically designed to run E2E tests using Detox would do the trick
– roughly, like so (in `app/build.gradle`):

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

Here we utilize Gradle’s `initWith` to easily define `releaseE2E` in a way that is identical to the `release` build-type, with the exception of considering Detox' `proguard-rules-app.pro` in the minification process.

Following the example, you would then have to build your app using `gradlew assembleReleaseE2E` rather than `gradlew assembleRelease` before running Detox, and instruct Detox (i.e. via `binaryPath` in the Detox configuration file) to use the APK resulted specifically by _that_ Gradle target (e.g. in `app/build/apk/releaseE2E/app-releaseE2E.apk` instead of the equivalent `app/build/apk/release/app-release.apk`).

> Note: if your app contains flavors – that makes things a bit trickier, but the approach can generally be adjusted to support that as well.

**Last but not least:** If you’re having issue with Detox' ProGuard rules, please report them [here](https://github.com/wix/Detox/issues/new/choose).
A special thanks to [@GEllickson-Hover](https://github.com/GEllickson-Hover) for reporting issues related to obfuscation in [#2431](https://github.com/wix/Detox/issues/2431).
