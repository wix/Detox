# Dealing With Problems With Building the App & Detox

This page is about issues related to building the app, typically triggered when running `detox build` (and not `detox test`, for example).

## Android

### Problem: AAPT - resource linking failure

For build errors involving AAPT resource linking failure, such as this one:

```plain text
Execution failed for task ':app:processReleaseAndroidTestResources'.
> A failure occurred while executing com.android.build.gradle.internal.res.LinkApplicationAndroidResourcesTask$TaskAction
   > Android resource linking failed
     ERROR:: AAPT: error: resource style/Widget.AppCompat.TextView ...
```

Ensure that the following line appears in your app build script in the `dependencies` section:

```gradle title="android/app/build.gradle"
dependencies {
    // ...
    implementation 'androidx.appcompat:appcompat:1.1.0' // (check what the latest version is!)
}
```

### Problem: minSdkVersion mismatch

For Gradle errors involving `minSdkVersion` mismatches resembling this one:

```text
uses-sdk:minSdkVersion 18 cannot be smaller than version 21 declared in library [com.facebook.react:react-native:0.64.3] /Users/janedoe/.gradle/caches/transforms-3/6a9cd4eeeb285f80b9e6f413ecd78d0d/transformed/jetified-react-native-0.64.3/AndroidManifest.xml as the library might be using APIs not available in 18
        Suggestion: use a compatible library with a minSdk of at most 18,
                or increase this project's minSdk version to at least 21,
                or use tools:overrideLibrary="com.facebook.react" to force usage (may lead to runtime failures)
```

Try applying the solution suggested in [this Stack-overflow](https://stackoverflow.com/questions/21032271/how-to-inject-android-configuration-to-each-subproject-with-gradle) post, namely adding this to your root-project's `build.gradle` file (replace `21` those matching your app's `build.gradle`):

```gradle title="android/build.gradle"
allprojects {
    afterEvaluate {
        if (it.hasProperty('android')){
            android {
                defaultConfig {
                    minSdkVersion 21 // Replace '21' with whatever suites your case
                }
            }
        }
    }
}
```

### Problem: Kotlin `stdlib` version conflicts

The problems and resolutions here are different depending on whether you’re using Detox as a precompiled dependency artifact (i.e. an `.aar`) - which is by far the common case, or compiling it yourself.

#### Resolving for a precompiled dependency (`.aar`)

Of all [Kotlin implementation flavors](https://kotlinlang.org/docs/reference/using-gradle.html#configuring-dependencies), Detox assumes the most recent one, namely `kotlin-stdlib-jdk8`. If your Android build fails due to conflicts with implementations coming from other dependencies or even your own app, consider adding an exclusion to either the "other" dependencies or detox itself, for example:

```diff
dependencies {
-    androidTestImplementation('com.wix:detox:+')
+    androidTestImplementation('com.wix:detox:+') {
+        exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
+    }
}
```

Detox should work with `kotlin-stdlib-jdk7`, as well.

A typical error output formed by `Gradle` in this case is as provided, for example, in [#1380](https://github.com/wix/Detox/issues/1380):

```plain text
Could not determine the dependencies of task ':detox:compileDebugAidl'.
> Could not resolve all task dependencies for configuration ':detox:debugCompileClasspath'.
   > Could not resolve org.jetbrains.kotlin:kotlin-stdlib:1.3.0.
     Required by:
         project :detox
      > Cannot find a version of 'org.jetbrains.kotlin:kotlin-stdlib' that satisfies the version constraints:
           Dependency path 'OurApp:detox:unspecified' --> 'com.squareup.okhttp3:okhttp:4.0.0-alpha01' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.3.30'
           Dependency path 'OurApp:detox:unspecified' --> 'com.squareup.okio:okio:2.2.2' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.2.60'
           Dependency path 'OurApp:detox:unspecified' --> 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.3.0' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.3.0'
           Dependency path 'OurApp:detox:unspecified' --> 'com.facebook.react:react-native:0.59.5' --> 'com.squareup.okhttp3:okhttp:4.0.0-alpha01' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.3.30'
           Dependency path 'OurApp:detox:unspecified' --> 'com.facebook.react:react-native:0.59.5' --> 'com.squareup.okio:okio:2.2.2' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.2.60'
           Dependency path 'OurApp:detox:unspecified' --> 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.3.0' --> 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.3.0' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.3.0'
           Constraint path 'OurApp:detox:unspecified' --> 'org.jetbrains.kotlin:kotlin-stdlib' strictly '1.3.0' because of the following reason: debugRuntimeClasspath uses version 1.3.0
           Constraint path 'OurApp:detox:unspecified' --> 'org.jetbrains.kotlin:kotlin-stdlib' strictly '1.3.0' because of the following reason: debugRuntimeClasspath uses version 1.3.0

   > Could not resolve org.jetbrains.kotlin:kotlin-stdlib-common:1.3.0.
     Required by:
         project :detox
      > Cannot find a version of 'org.jetbrains.kotlin:kotlin-stdlib-common' that satisfies the version constraints:
           Dependency path 'OurApp:detox:unspecified' --> 'com.squareup.okhttp3:okhttp:4.0.0-alpha01' --> 'org.jetbrains.kotlin:kotlin-stdlib:1.3.30' --> 'org.jetbrains.kotlin:kotlin-stdlib-common:1.3.30'
           Constraint path 'OurApp:detox:unspecified' --> 'org.jetbrains.kotlin:kotlin-stdlib-common' strictly '1.3.0' because of the following reason: debugRuntimeClasspath uses version 1.3.0
```

(i.e. the project indirectly depends on different versions of `kotlin-stdlib`, such as `1.3.0`, `1.3.30`, `1.2.60`)

#### Resolving for a compiling subproject

Detox requires the Kotlin standard-library as its own dependency. Due to the [many flavors](https://kotlinlang.org/docs/reference/using-gradle.html#configuring-dependencies) by which Kotlin has been released, multiple dependencies often create a conflict.

For that, Detox allows for the exact specification of the standard library to use using two Gradle globals: `detoxKotlinVersion` and `detoxKotlinStdlib`. You can define both in your root build script file:

```gradle title="android/build.gradle"
buildscript {
    // ...
    ext.detoxKotlinVersion = '1.3.0' // Detox' default is 1.2.0
    ext.detoxKotlinStdlib = 'kotlin-stdlib-jdk7' // Detox' default is kotlin-stdlib-jdk8
}
```

### Problem: `Duplicate files copied in ...`

If you get an error like this:

```plain text
Execution failed for task ':app:transformResourcesWithMergeJavaResForDebug'.
> com.android.build.api.transform.TransformException: com.android.builder.packaging.DuplicateFileException: Duplicate files copied in APK META-INF/LICENSE
```

You need to add this to the `android` section of your app build script:

```gradle title="android/app/build.gradle"
packagingOptions {
    exclude 'META-INF/LICENSE'
}
```

### Running Detox in a Rosetta environment

When working with dependencies that require running your iOS app in a Rosetta simulator, you may encounter issues with the `detox build` command. These issues often relate to SwiftEmitModule or SwiftCompile errors. To resolve this, follow these steps:

1. Modify your build command in the Detox configuration:

```json
"build": "xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Debug -sdk iphonesimulator -arch x86_64 -derivedDataPath ios/build"
```

1. Run the following command in your terminal to ensure Xcode is properly selected:

```bash
sudo xcode-select --switch /Applications/Xcode.app
```

1. Launch the iOS simulator in Rosetta mode:

```bash
arch -x86_64 /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/Contents/MacOS/Simulator
```

After following these steps, the `detox build` command should run without errors in your Rosetta environment.

:::note

This approach configures Detox specifically to build and run with Rosetta without affecting your app's regular builds. To run your app with Rosetta in Xcode, enable Rosetta simulator destinations via Xcode.

:::
