# Dealing With Problems With Building the App & Detox

This page is about issues related to building the app, typically triggerred when running `detox build` (and not `detox test`, for example).

For troubleshooting of other issue, refer to our [troubleshooting index](Troubleshooting.md).

## Android

### Problem: Kotlin stdlib version conflicts

The problems and resolutions here are different if you're using Detox as a precompiled dependency artifact (i.e. an `.aar`) - which is the default, or compiling it yourself.

#### Resolving for a precompiled dependency (`.aar`)

Of all [Kotlin implementation flavours](https://kotlinlang.org/docs/reference/using-gradle.html#configuring-dependencies), Detox assumes the most recent one, namely `kotlin-stdlib-jdk8`. If your Android build fails due to conflicts with implementations coming from other dependencies or even your own app, consider adding an exclusion to either the "other" dependencies or detox itself, for example:

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

```
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

Detox requires the Kotlin standard-library as it's own dependency. Due to the [many flavours](https://kotlinlang.org/docs/reference/using-gradle.html#configuring-dependencies) by which Kotlin has been released, multiple dependencies often create a conflict.

For that, Detox allows for the exact specification of the standard library to use using two Gradle globals: `detoxKotlinVersion` and `detoxKotlinStdlib`. You can define both in your  root build-script file (i.e.`android/build.gradle`):

```groovy
buildscript {
    // ...
    ext.detoxKotlinVersion = '1.3.0' // Detox' default is 1.2.0
    ext.detoxKotlinStdlib = 'kotlin-stdlib-jdk7' // Detox' default is kotlin-stdlib-jdk8
}
```



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

