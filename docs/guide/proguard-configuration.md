# ProGuard configuration

:::tip

You can skip this guide if you are working solely with debug builds (`android.emu.debug`, etc.),
but as soon as you move to the **release builds**, where the native code gets minified and obfuscated,
you are going to have problems with Detox if you leave your ProGuard rules not configured.

:::

Since Detox relies on [Android Reflection API] to integrate with React Native on Android, you should keep [ProGuard minification] under tight control.
Otherwise, you’ll be seeing Detox crashing or hanging up infinitely upon an attempt to run tests with your app built in **release mode**.

To fix that, you’d need to return to your app build script:

```diff title="app/build.gradle"
     buildTypes {
     …
// highlight-next-line
         release { /* (1) */
             minifyEnabled true

// highlight-next-line
   /* (2) */ proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
// highlight-next-line
+  /* (3) */ proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
         }
     }
```

1. `release` build type is typically the one to have ProGuard enabled.
1. ProGuard files present by default in React Native projects. Check out [Android docs][ProGuard minification] to get to know more.
1. Detox-specific [exclude list](https://github.com/wix/Detox/blob/master/detox/android/detox/proguard-rules.pro) for ProGuard.

:::info

In order for Detox to be able to work properly, in `proguard-rules-app.pro`, it effectively declares rules that retain most of React-Native’s code (i.e. keep it unminified, unobfuscated) in your **production** APK.

:::

## Obfuscation

Exempting source files from the obfuscation means that their contents might be restored by unauthorized people,
but this should not be an issue for you, because React Native is an open-source project per se.

If it nevertheless bothers you, there are workarounds such as defining multiple build flavors: one for running
end-to-end tests with Detox, and the other one for publishing to the marketplaces:

```gradle title="app/build.gradle"
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'

            signingConfig signingConfigs.release
        }
// highlight-start
        releaseE2E {
            initWith release
            setMatchingFallbacks('release')

            proguardFile "${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"
        }
    }
// highlight-end
```

As can be seen above, we use `initWith` and `setMatchingFallbacks` to extend the new `releaseE2E` build type from
the existing one, and then we add an override to it, i.e. `proguardFile`.

Following the example, you would then have to adjust your `build` and `binaryPath` properties accordingly:

```diff
{
  apps: {
     'android.release': {
       type: 'android.apk',
-      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
+      binaryPath: 'android/app/build/outputs/apk/releaseE2E/app-releaseE2E.apk',
-      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
+      build: 'cd android && ./gradlew assembleReleaseE2E assembleAndroidTest -DtestBuildType=release'
     },`
```

:::note

If your app already contains flavors – that makes things a bit trickier, but the approach can generally be adjusted to support that as well.

:::

**Last but not least:** If you’re having issue with Detox' ProGuard rules, please report them [here](https://github.com/wix/Detox/issues/new/choose).

A special thanks to [@GEllickson-Hover](https://github.com/GEllickson-Hover) for reporting issues related to obfuscation in [#2431](https://github.com/wix/Detox/issues/2431).

[Android Reflection API]: https://developer.android.com/reference/java/lang/reflect/package-summary

[ProGuard minification]: https://developer.android.com/studio/build/shrink-code
