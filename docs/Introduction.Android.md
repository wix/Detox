# Adding Android

## Setup

### 1. Do the initial setup described in the Getting Started Guide

- [Getting Started](Introduction.GettingStarted.md)

### 2. Add the detox Android project as an androidTestCompile dependency

You need to add this into your `android/settings.gradle`:
```gradle
include ':detox'
project(':detox').projectDir = new File(rootProject.projectDir, '../node_modules/detox/android/detox')
```

> In case your project’s RN version is at least 0.46.0 change the oldOkhttp configuration string to newOkhttp, in the `app/build.gradle` here.

In the `android/app/build.gradle` you need to add this into your dependencies section:

```gradle
androidTestCompile(project(path: ":detox", configuration: "newOkhttpDebug"), {
    exclude group: 'com.android.support', module: 'support-annotations'
})
```

Please be aware that the `minSdkVersion` needs to be at least 18.

### 3. Add `jacoco-coverage` as dependency in the buildscript

You need to add this to `android/build.gradle` into `buildscript > dependencies`:

```gradle
classpath 'com.palantir:jacoco-coverage:0.4.0'
```

And in the same file you need to add this under `allprojects > repositories`:
```gradle
maven {
    url "https://maven.google.com"
}
```

### 4. Introduce [Espresso](https://developer.android.com/training/testing/espresso/index.html) test runner

Detox Android is a standard Android integration test. Although, it is completely asynchronous.

It uses Espresso internally, therefore you have to use an AndroidJUnitRunner as your test runner (or a subclass of it).
For this you need to modify your `android/app/build.gradle`:

```gradle 
android {
    defaultConfig {
        testInstrumentationRunner "android.support.test.runner.AndroidJUnitRunner"
    }
}
```

### 5. Create Android Test class

You need to add the file `android/app/src/androidTest/java/com/[your.package]/DetoxTest.java` and fill it like [this](../detox/test/android/app/src/androidTest/java/com/example/DetoxTest.java), expect that you need to change the package to your projects name.

### 6. Add Android configuration

Add this part to your `package.json`:

```json
"detox": {
    "configurations": {
        "android.emu.debug": {
            "binaryPath": "android/app/build/outputs/apk/app-debug.apk",
            "build": "pushd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && popd",
            "type": "android.emulator",
            "name": "Nexus_5X_API_25"
        }        
    }
}
```

### 7. Run the tests

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

You need to add this to the `packagingOptions` of your `android/app/build.gradle`:

```gradle
packagingOptions {
    exclude 'META-INF/LICENSE'
}
```

### Problem: `Conflict with dependency ...`

If you get an error like this:

```sh
Conflict with dependency 'com.fasterxml.jackson.core:jackson-core'. Resolved versions for app (2.8.7) and test app (2.2.3) differ. See http://g.co/androidstudio/app-test-app-conflict for details.
```

You need to exclude it from the `android/app/build.gradle`:

```gradle
 androidTestCompile(project(path: ":detox", configuration: "newOkhttpDebug"), {
    exclude group: 'com.android.support', module: 'support-annotations'
    exclude group: 'com.fasterxml.jackson.core' // <- add this
})
```
