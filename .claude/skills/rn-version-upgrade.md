# Skill: Add Support for a New React Native Version in Detox

This skill guides the process of adding support for a new React Native version in the Detox testing framework. Detox is unique because it relies heavily on **reflection into RN internals** (especially on Android) for idling resource synchronization, and must maintain backward compatibility across multiple RN versions simultaneously.

## Prerequisites

Before starting, gather:
- The target RN version number (e.g., `0.84.0`)
- The current highest supported RN version (check `detox/test/package.json` and `.buildkite/pipeline_common.sh`)
- The current lowest supported RN version (check `.buildkite/jobs/` for the oldest pipeline)

## Phase 1: Research Breaking Changes

**This is the most critical phase for Detox. RN internal class/field renames break Detox's reflection-based synchronization on Android.**

### 1a. Read the RN Release Blog & Changelog

Fetch the release blog post and changelog:
- Blog: `https://reactnative.dev/blog` (search for the version)
- Changelog: `https://github.com/facebook/react-native/blob/main/CHANGELOG.md`

Focus on:
- **Removed/renamed internal classes and fields** -- Detox reflects into RN internals for synchronization
- **Architecture changes** (New Architecture enforcement, legacy arch removal)
- **Build system changes** -- Gradle version, Android SDK levels, Kotlin version, CocoaPods changes
- **Metro config changes** -- API renames (e.g., `blacklistRE` → `blockList`)
- **Android manifest changes** -- e.g., `usesCleartextTraffic` behavior changes
- **Kotlin version requirements** -- RN often bumps minimum Kotlin version
- **MainApplication.kt template changes** -- `ReactNativeHost` vs `ReactHost`, `isHermesEnabled` nullability, entry point APIs

### 1b. Check Detox's Reflection Points (CRITICAL)

Detox uses reflection to access RN internal fields for idling synchronization. **When RN renames private fields from `mFoo` to `foo`, Detox's reflection breaks silently at runtime -- you won't see the error until E2E tests run.** Check ALL reflection files:

```bash
# List all reflected/reflection files
find detox/android -name "*Reflected*" -o -name "*Reflection*" -o -name "*ReflectUtils*"

# Search for field name strings used in reflection
grep -rn "Reflect.on\|\.field(" detox/android/ --include="*.kt" --include="*.java"

# Search for Kotlin reflection usage
grep -rn "memberProperties\|memberFunctions\|declaredFunctions" detox/android/ --include="*.kt"
```

**Reflection files that commonly break on RN upgrades:**

| File | What It Reflects | Common Breakage |
|------|-----------------|-----------------|
| `JavaTimersReflected.kt` | `ReactContext.mReactHost` → `reactHost`, `mJavaTimerManager` → `javaTimerManager` | Field renames (m-prefix removal) |
| `NetworkingModuleReflected.kt` | `NetworkingModule.mClient` → `client` | Field renames |
| `AnimatedModuleIdlingResource.kt` | `NativeAnimatedModule` operations queue `isEmpty` | Method vs property in Kotlin |
| `FabricUIManagerIdlingResources.kt` | Fabric dispatcher internals | New arch changes |
| `SerialExecutorReflected.kt` | AsyncStorage internals | Storage module changes |
| `UiControllerImplReflected.kt` | Espresso UI controller | Espresso version changes |
| `NativeHierarchyManagerReflected.kt` | Paper UI manager hierarchy | UI module restructuring |
| `UIManagerModuleReflected.kt` | Paper UI manager module | UI module restructuring |
| `ViewCommandOpsQueueReflected.kt` | View command dispatch queue | Queue implementation changes |
| `DispatchCommandOperationReflected.kt` | Command dispatch internals | Command API changes |
| `MQThreadsReflector.kt` | RN message queue threads | Threading model changes |

**Always run the `find` command above** -- this table may be incomplete if new reflection files are added.

**Strategy for reflection fixes:**
1. Compare the target RN version's source for each reflected class against the previous version
2. Look for `m`-prefix removal pattern (RN has been systematically renaming `mFoo` → `foo`)
3. Use version-conditional reflection: check `ReactNativeInfo.rnVersion().minor >= XX` to pick the right field name
4. For Kotlin property vs method ambiguity, use `KotlinReflectUtils.kt` (see Phase 3b)

### 1c. Check Test App Dependencies

For each dependency in `detox/test/package.json`:
1. **@react-native-async-storage/async-storage** -- Frequent build issues. Check https://github.com/react-native-async-storage/async-storage/issues. May require building debug before release as a workaround.
2. **@react-native-community/slider** -- Check Fabric/new arch support
3. **@react-native-community/datetimepicker** -- Check version compatibility
4. **react-native-webview** -- Check for new arch support
5. **react-native-permissions** -- Check Podfile setup changes

Check peer dependencies: `npm info react-native@<version> peerDependencies`

## Phase 2: Update Default Versions and Build Configuration

### 2a. Update `package.json` Files

The default (latest) RN version is set in three places:
- `detox/test/package.json` -- test app dependencies
- `examples/demo-react-native/package.json` -- demo app dependencies
- `detox/package.json` -- devDependencies for the library itself

Update in each:
- `react-native` to target version
- `react` to matching peer dep version (`npm info react-native@0.84.0 peerDependencies.react`)
- `@react-native/babel-preset`, `@react-native/eslint-config`, `@react-native/metro-config`, `@react-native/typescript-config` to `0.<minor>.0`
- `@react-native-community/cli`, `cli-platform-android`, `cli-platform-ios` to matching version

### 2b. Update Version-Switch Infrastructure

**`scripts/change_react_native_version.js`**: Only needs changes if the new version requires special devDependency overrides when CI downgrades to older RN versions. Currently has overrides only for RN 73 and 77. Note: this script updates three paths (`detox/test`, `examples/demo-react-native`, and `detox` itself) via `scripts/change_all_react_native_versions.sh`.

**`detox/scripts/updateGradle.js`**: Uses a `default` case in the switch statement that covers all versions not explicitly listed. **Only add a new case if the target RN version requires a different Gradle version than the current default.** Check the RN template app for the required Gradle version. Caution: RN 0.82 initially upgraded to Gradle 9.0.0 but had to revert to 8.14.3 -- always verify what the RN template actually ships.

**`detox/android/rninfo.gradle`**: Add an `isRNXXOrHigher` flag **only if you need version-conditional logic** in Gradle build files (e.g., Kotlin version branching, manifest changes). Not every RN version needs a flag -- the current file goes up to `isRN81OrHigher` despite supporting RN 82/83.

### 2c. Update Kotlin Version Handling (if needed)

Check if the new RN version requires a newer Kotlin version. This is set conditionally in `detox/test/android/build.gradle`:
```groovy
if (ext.rnInfo.isRN80OrHigher) {
    kotlinVersion = '2.1.20'
} else {
    kotlinVersion = '2.0.20'
}
```

### 2d. Update Metro Config (if needed)

Metro config in `detox/test/metro.config.js` and `examples/demo-react-native/metro.config.js`. The current config uses `@react-native/metro-config`'s `getDefaultConfig`/`mergeConfig` with `blockList` array. Check if RN changed the Metro config API.

### 2e. Update MainApplication.kt (if needed)

RN frequently changes the Android `MainApplication.kt` template. Compare against `npx @react-native-community/cli init` output for the target version. Update:
- `detox/test/android/app/src/main/java/com/example/MainApplication.kt`
- `detox/test/android/app/src/main/java/com/example/DetoxRNHost.kt`
- `examples/demo-react-native/android/app/src/main/java/com/example/MainApplication.kt`

Historical changes: `isHermesEnabled` became non-nullable (RN 0.81), entry point changed to `DefaultNewArchitectureEntryPoint.load()` (RN 0.82), `DetoxRNHost` was split out for backward compatibility (RN 0.82).

### 2f. Update Android Manifest (if needed)

Check for manifest behavior changes. Example: RN 0.81 started setting `usesCleartextTraffic` automatically, requiring version-conditional logic in `build.gradle` (not hardcoded in manifest):
```groovy
if (!rnInfo.isRN81OrHigher) {
    manifestPlaceholders = [usesCleartextTraffic: "true"]
}
```

### 2g. Install Dependencies

```bash
yarn install
cd detox/test/ios && pod install && cd ../../..
cd examples/demo-react-native/ios && pod install && cd ../../..
```

## Phase 3: Fix Android Reflection Breakages

### Strategy

**Batch-fix all reflection breakages identified in Phase 1b BEFORE building.** This is the most common source of Detox failures on new RN versions.

### 3a. Pattern: Field Name Renames (m-prefix removal)

RN has been systematically renaming internal fields from `mFieldName` to `fieldName`. Fix with version-conditional reflection:

```kotlin
val fieldName = if (ReactNativeInfo.rnVersion().minor >= XX) {
    "newFieldName"
} else {
    "mOldFieldName"
}
Reflect.on(target).field(fieldName).get()
```

### 3b. Pattern: Kotlin Property vs Method

When RN rewrites Java classes in Kotlin, methods like `isEmpty()` may become properties. Use `KotlinReflectUtils.kt` (`detox/android/detox/src/full/java/com/wix/detox/common/KotlinReflectUtils.kt`) which centralizes the fallback logic of trying method first (works in release/minified builds), then property (works in debug builds).

### 3c. Build and Test

```bash
cd detox/test && yarn build:android-debug && yarn build:android
```

Note: Building debug BEFORE release is sometimes necessary as a workaround for dependency build issues (e.g., AsyncStorage).

## Phase 4: Fix iOS Build Issues

iOS and Android fixes are independent -- these can be worked on in parallel with Phase 3.

### 4a. Podfile and Podspec Changes

Check if `pod install` succeeds. Common issues:
- New RN versions may change `react_native_pods.rb` behavior
- `min_ios_version_supported` may change
- Swift version may need to be set in `.pbxproj` (`SWIFT_VERSION = 5.0`)

### 4b. Xcode Project Settings

Check `detox/test/ios/example.xcodeproj/project.pbxproj` and `examples/demo-react-native/ios/example.xcodeproj/project.pbxproj` for stale build settings, missing `SWIFT_VERSION`, or outdated `HEADER_SEARCH_PATHS`.

### 4c. Build iOS

```bash
cd detox/test && yarn build:ios
```

## Phase 5: Fix E2E and Integration Test Failures

### 5a. Run the Full CI Test Suite

The CI runs more than just E2E tests. Run in order:

```bash
# JS integration tests
cd detox/test && yarn integration

# Android native unit tests
cd detox/android && yarn unit:android-release

# E2E tests
cd detox/test && yarn e2e:ios
cd detox/test && yarn e2e:android

# Unhappy-path tests
cd detox/test && scripts/ci_unhappy.sh ios
cd detox/test && scripts/ci_unhappy.sh android
```

### 5b. Snapshot Tests

View hierarchy XML snapshots and screenshot snapshots may change with new RN versions. Update when visual changes are expected.

### 5c. Behavioral Changes and Test Fixes

New RN versions may change behavior affecting tests:
- **Pull-to-refresh behavior** (RN 0.80 -- needed a test screen fix)
- **Animation timing** (affects idling resource synchronization)
- **WebView rendering** (snapshot differences)
- **Test imports** (RN 0.81: missing import in `33.attributes.test.js` blocked CI)

When tests fail, investigate before skipping -- the failure might be a real Detox regression, not a flaky test. (RN 0.82: a webview test "fix" was immediately reverted.)

## Phase 6: CI Pipeline Setup

Set up CI after the code compiles and tests pass locally.

### 6a. Create Buildkite Pipeline Jobs

Copy from the previous highest version:

```bash
cp .buildkite/jobs/pipeline.android_rn_83.yml .buildkite/jobs/pipeline.android_rn_84.yml
cp .buildkite/jobs/pipeline.ios_rn_83.yml .buildkite/jobs/pipeline.ios_rn_84.yml
cp .buildkite/jobs/pipeline.android_demo_app_rn_83.yml .buildkite/jobs/pipeline.android_demo_app_rn_84.yml
cp .buildkite/jobs/pipeline.ios_demo_app_rn_83.yml .buildkite/jobs/pipeline.ios_demo_app_rn_84.yml
```

Edit each file:
- Update the label: `":android::detox: RN .84 + Android: Tests app"`
- Update `REACT_NATIVE_VERSION: 0.84.0`
- Keep `RCT_NEW_ARCH_ENABLED: 1` (new arch is standard now)
- Keep `DETOX_DISABLE_POD_INSTALL: true` and `DETOX_DISABLE_POSTINSTALL: true` on Android jobs

Note: demo_app pipelines may not exist for all RN versions (e.g., the oldest supported version 77 has only test pipelines). Check what exists before copying.

### 6b. Register Jobs in Pipeline Script

Add new jobs to `.buildkite/pipeline_common.sh` and optionally drop old version entries. If dropping old versions, also clean up `scripts/change_react_native_version.js` version-specific overrides.

## Phase 7: Backward Compatibility and Documentation

### 7a. Test Older Versions via CI

The CI sets `REACT_NATIVE_VERSION` env var and runs `scripts/change_all_react_native_versions.sh`, which calls `change_react_native_version.js` for three paths: `detox/test`, `examples/demo-react-native`, and `detox`. Verify older version pipelines still pass.

### 7b. Version-Conditional Code Checklist

- [ ] `rninfo.gradle` has new flag (if version-conditional Gradle logic was added)
- [ ] `updateGradle.js` default covers the new version (or has explicit case)
- [ ] `change_react_native_version.js` handles the new version's devDependencies (if needed)
- [ ] All reflection code uses version checks with `>=` (not try/catch for field names)
- [ ] Kotlin version is set correctly for each RN version range
- [ ] Manifest settings are version-conditional where needed
- [ ] Metro config works for all supported versions

### 7c. Test the Version-Switch Script

```bash
REACT_NATIVE_VERSION=0.77.2 node scripts/change_react_native_version.js "detox/test" 0.77.2 "dependencies"
```

### 7d. Update Documentation

- `docs/introduction/partials/_getting-started-rn.md` -- supported RN version range
- README.md if it mentions supported versions
