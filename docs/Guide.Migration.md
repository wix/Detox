---
id: migration
slug: guide/migration
title: Migration Guide
sidebar_label: Migration Guide
---

## Migration Guide

We are improving Detox API as we go along, sometimes these changes require us to break the API in order for it to make more sense. These migration guides refer to breaking changes. If a newer version has no entries in this document, it means it does not require special migration steps. Refer to the release notes of the latter builds to learn about their improvements and changes.

### 19.2

The release has a **developer experience** improvement – _Detect pending in-flight requests_ ([#3003](https://github.com/wix/Detox/issues/3003), [**@jonathanmos**](https://github.com/jonathanmos)).
The feature adds extra logic that prevents forgotten `await` statements on asynchronous Detox APIs. That’s why you might see a new error like this:

```plain text
FAILED
DetoxRuntimeError: The pending request \#246 ("invoke") has been rejected due to the following error:

Detox has detected multiple interactions taking place simultaneously. Have you forgotten to apply an await over one of the Detox actions in your test code?
```

That should help you find forgotten `await`s in your code that are a potential reason for flakiness in E2E tests.
You’ll need to find those places and apply trivial fixes like shown below:

```diff
   await screenDriver.performSomeAction();
-  expect(screenDriver.get.myElement()).toBeNotVisible();
+  await expect(screenDriver.get.myElement()).toBeNotVisible();
```

### 19.0

**Version 19 is not really a breaking change!**

We decided to bump Detox into a major version release, nonetheless, because it is breaking for projects that sport [custom Detox drivers](Guide.ThirdPartyDrivers.md), such as [`detox-puppeteer`](https://github.com/ouihealth/detox-puppeteer).

If you are a maintainer of such a project, and you wish to upgrade your Detox dependency to 19 (kudos! :clap:),  follow this step-by-step migration guide; You can refer to [this pull-request](https://github.com/ouihealth/detox-puppeteer/pull/13), which does that for the  `detox-puppeteer` project.

#### Migrating Custom Drivers

The core of the change is that Detox' drivers framework is **no longer a single monolith**, responsible for everything platform-specific. Rather, it’s been broken down to these subresponsibilies:

- Allocation: The process of launching / selecting a device over which the tests would run in the current execution.
- Validation: Execution environment checkups.
- Artifacts: Platform-based selection of build-artifacts implementation (e.g. screenshots).
- Runtime

> You can find a visual explanation, [here](https://github.com/wix/Detox/files/7338121/pre-multiapps-rfc.pdf).

In addition, the runtime driver is no longer state-less -- basically, allowing implementation to hold any state that is required in identifying and managing the associated device.

##### How to migrate

Everything here will be based on the changes made in the [`detox-puppeteer` example](https://github.com/ouihealth/detox-puppeteer) - names included (please don’t use them as-is in your own implementation!).

**Allocation:**

- Create a new class, called `PuppeteerDeviceAllocation` (change name to something that would make sense in your project).
- Move everything currently in `PuppeteerDriver.acquireFreeDevice()` and `.shutdown()` onto `PuppeteerDeviceAllocation.allocate()` and `.free()`, respectively.
- Create a POJO class called `PuppeteerAllocCookie`. This class should hold anything that would later be required in order to specify the specifically associated device (example: `UDID` for iOS simulators, `adb` names for Android devices).
- Make `.allocate()` return an instance of your cookie class. Puppeteer example: [here](https://github.com/ouihealth/detox-puppeteer/pull/13/files#diff-818f6c5309fffe5c710e542216ffdb55f468fd2f8035feb0b0c917785489aca7R841).
- **Delete `PuppeteerDriver.acquireFreeDevice()` and `PuppeteerDriver.shutdown()`.**

> For a precise class c'tor and method signatures, see [here](https://github.com/ouihealth/detox-puppeteer/pull/13/files#diff-818f6c5309fffe5c710e542216ffdb55f468fd2f8035feb0b0c917785489aca7R830).

Add the new allocation class to the `module.exports` list, under the name: `DeviceAllocationDriverClass`.

**Validation:**

- If you have any validations implemented in `PuppeteerDriver.prepare()`, create a class called `PuppeteerEnvironmentValidator`.
- Move anything inside `PuppeteerDriver.prepare()` to `PuppeteerEnvironmentValidator.validate()`.
- **Delete `PupeteerDriver.prepare()`.**

> For a precise class c'tor and method signatures, see [here](https://github.com/ouihealth/detox-puppeteer/pull/13/files#diff-818f6c5309fffe5c710e542216ffdb55f468fd2f8035feb0b0c917785489aca7R798).

Add the new (optional) class to the `module.exports` list, under the name: `EnvironmentValidatorClass`.

**Artifacts:**

- Move your implementation of `PuppeteerDriver.declareArtifactPlugins()` to the same method in a new class, called `PuppeteerArtifactPluginsProvider.declareArtifactPlugins()` (change name to something that would make sense in your project).

> There are no changes in method signature in this case.

Add the new class to the `module.exports` list, under the name: `ArtifactPluginsProviderClass`.

**Runtime:**

- Optionally rename your class from `PuppeteerDriver` to `PuppeteerRuntimeDriver`.
- In the methods remaining in the class accepting the `deviceId` arg: **remove the `deviceId` arg entirely**. This might break your implementation - don’t worry, continue reading.
- If applicable, change the signature of the class' c'tor to accept the cookie as its 2nd argument (instance previously allocated in `PuppeteerAllocationDriver.allocate()`). Save data from the cookie as part of the driver’s state, in order to unbreak your implementation, following the previous step.
- Add two methods: `getExternalId()` and `getDeviceName()`. Implement them such that they would comply with the `device.id` and `device.name` [API contracts](APIRef.DeviceObjectAPI.md), respectively.

Export the runtime driver class in the `module.exports` list as `RuntimeDriverClass`, **instead of `DriverClass`.**

##### Troubleshooting

For issue related to these migrations, approach us by [submitting an issue on GitHub](https://github.com/wix/Detox/issues/new/choose). Please apply the `Detox19` label.

### 18.6.0

Detox has normalized the configuration format, so that along with the combined `configurations` object you now can define your `devices` and `apps` separately.
Please refer to the [configuration doc](https://github.com/wix/Detox/blob/18.6.0/docs/APIRef.Configuration.md) to obtain more details.
This change is backward-compatible, although the new format is now the recommended option.

### 18.0

Detox now uses a custom synchronization system on iOS, [developed in-house](https://github.com/wix/DetoxSync); this is the second step in phasing out our Earl Grey usage. We have tested this system extensively internally, and are confident that it should work as expected. There are no known limitations with the new system.

If you are seeing issues with the new sync system, please open an issue.

**Breaking:**

- **iOS.** Detox now requires iOS 13.0 and above iOS simulator runtimes, and iOS 12.x and below are no longer supported. This does not require that you drop support for iOS 12.x in your apps, just that tests will no longer work on iOS 12 and below. Please make sure your tests are running on iOS 13 or above
- **JS.** :warning: Detox no longer launches the app automatically (even if asked to do so in configuration) — you have to launch your app explicitly:

```diff
+  beforeAll(async () => {
+    await device.launchApp();
+  });
```

- **JS (jest-circus).** The `DetoxCircusEnvironment` provided from `detox/runners/jest-circus` package now requires two arguments in its constructor, so you have to update your descendant class signature:

```diff
class CustomDetoxEnvironment extends DetoxCircusEnvironment {
-  constructor(config) {
-    super(config);
+  constructor(config, context) {
+    super(config, context);
```

- **JS (iOS).** `device.launchApp({ launchArgs: { ... })` argument escaping has been improved. If you use complex launch args such as regular expressions, make sure you remove manual escaping from now on to avoid erroneous double escaping, e.g.:

```diff
 await device.launchApp({
   launchArgs: {
-    detoxURLBlacklistRegex: '(\\".*example.com/some-url/.*\\")' }`,
+    detoxURLBlacklistRegex: '(".*example.com/some-url/.*")' }`,
   },
 });
```

- **JS (internal).** There is a breaking change for people writing custom Detox integrations. Environment variable naming schema has changed – now Detox uses prefix to distinguish its own environment variables (usually passed from `detox test` CLI), e.g.: `recordLogs=all` becomes `DETOX_RECORD_LOGS=all`, `loglevel=trace` becomes `DETOX_LOGLEVEL=trace`, and so on.

### 17.5.2

Fixes the issue from **17.4.7** (see below) - now the migration guide for **17.4.7** can be safely ignored.

### 17.4.7

This release was not meant to be breaking in any sense, but unfortunately there are two minor caveats that leaked in.

#### `jest-cli`

From now on, Detox explicitly depends on `jest-cli` package (marked as a peer dependency), that’s why if you see an error like the one below:

```plain text
Cannot find module 'jest-cli/build/cli/args'
```

~~You should add `jest-cli` to your `package.json`’s `devDependencies` and rerun `npm install`, e.g.:~~

**UPD**: since `detox@17.5.2` you can ignore this advice. The problem should go away **without** these edits:

```diff
 "devDependencies": {
   "jest": "26.x.x",
+  "jest-cli": "26.x.x",
```

#### `detox-cli`

If you were using `detox-cli` global package, make sure to upgrade it before proceeding to `detox@17.4.7`.

```sh
npm -g install detox-cli
```

If you have an older version of `detox-cli`, then you might see the following error on an attempt to run  `detox test <...args>`:

```plain text
'jest' is not recognized as an internal or external command,
operable program or batch file.
detox[43764] ERROR: [cli.js] Error: Command failed: jest --config e2e/config.json --testNamePattern "^((?!:android:).)*$" --maxWorkers 1 e2e
```

### 17.3.0

In the context of introducing the element screenshots feature ([#2012](https://github.com/wix/Detox/issues/2012)), we decided to slightly change the contract between Detox and externally-implemented _drivers_. These should be modified according to the follow diff-snippet:

```diff
class Expect {
-  constructor(invocationManager) {
+  constructor({ invocationManager }) {
     this._invocationManager = invocationManager;
  }
}

class PluginDriver {
  constructor() {
-    this.matchers = new Expect(new invocationManager());
  }
}

-module.exports = PluginDriver;
+module.exports = {
+  DriverClass: PluginDriver,
+  ExpectClass: Expect,
+}
```

### 17.0.0

Detox for iOS now uses an entirely new, custom-built matcher, action and expectation infrastructure. This is the first step in our roadmap of removing Earl Grey as a dependency.

While the new system has been designed to be as compatible as possible with the existing system, some changes we made to existing APIs that may or may not require your attention.

#### New API

- `pinch()`—new API for pinching elements, replacing the deprecated `pinchWithAngle()` (iOS)
- `getAttributes()`—new API for obtaining element properties (iOS)
- `not`—new API for inverting expectation logic (iOS, Android)

#### Modified API (**Potentially Breaking Changes**)

The following APIs have changed and require attention

- `by.text()`—matching elements by text actually uses the element’s text value instead of using the accessibility label (iOS)
- `by.traits()`—the supported trait values have changed (iOS)
- `atIndex()`—matched elements are now sorted by x and y axes to allow for stability between tests; indices will most likely change after upgrading to this version of Detox (iOS)
- `tap()`—this method now accepts an optional point to tap (iOS, Android)
- `setColumnToValue()`—this method no longer supports date pickers; use `setDatePickerDate()` to change picker dates (iOS)
- `setDatePickerDate()`—in addition to normal date formats, a new special case is introduced for ISO 8601 formatted date strings: `"ISO8601"` (iOS)

#### Deprecated API

The following APIs have been deprecated, but is still available

- `tapAtPoint()`—the API has been consolidated with `tap(point)` (iOS, Android)
- `pinchWithAngle()`—this API has been replaced with `pinch()` (iOS)
- `toBeNotVisible()`—deprecated in favor of `not.toBeVisible()` (iOS, Android)
- `toNotExist()`—deprecated in favor of `not.toExist()` (iOS, Android)

Make sure to read the API reference for [matchers](https://github.com/wix/Detox/blob/master/docs/APIRef.Matchers.md), [actions](https://github.com/wix/Detox/blob/master/docs/APIRef.ActionsOnElement.md) and [expectations](https://github.com/wix/Detox/blob/master/docs/APIRef.Expect.md).

If you see unexpected results, make sure to open an issue.

### 16.0.0

Detox now comes as a prebuilt framework on iOS, thus lowering npm install times and saving some build issues that happen due to unexpected Xcode setups.

To support this, Detox needs Swift 5 support, so the iOS requirements have changed slightly:

- **Xcode**: 10.2 or higher
  - **iOS Simulator Runtime**: iOS 12.2 or higher

This does not require that your app require iOS 12.2, only that you build and run your app on Xcode 10.2 or above, and use an iOS 12.2 or above simulator.

### 14.5.0

It is recommended to change "name" string to "device" object in your configurations, like shown below:

Before:

```json
{
  "ios.sim.debug": {
    "type": "ios.simulator",
    "name": "iPhone 11 Pro"
  },
  "android.emu.release": {
    "type": "android.emulator",
    "name": "Nexus_5X_API_29"
  },
  "android.att.release": {
    "type": "android.attached",
    "name": "YOGAA1BBB412"
  }
}
```

After:

```js
{
  "ios.sim.debug": {
    "type": "ios.simulator",
    "device": { // one of these or a combination of them
      "id": "D53474CF-7DD1-4673-8517-E75DAD6C34D6",
      "type": "iPhone 11 Pro",
      "name": "MySim",
      "os": "iOS 13.0",
    }
  },
  "android.emu.release": {
    "type": "android.emulator",
    "device": { // only avdName is supported at the moment
      "avdName": "Nexus_5X_API_29",
    }
  },
  "android.att.release": {
    "type": "android.attached",
    "device": { // only adbName is supported at the moment
      "adbName": "YOGAA1BBB412",
    }
  }
}
```

### 14.0.0

Detox 14.0.0 drops support for iOS 9.x simulators, and thus it also drops support for any API that is deprecated in iOS 10 and above. This includes legacy [remote](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623013-application?language=objc) and [local](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1622930-application?language=objc) notifications handling API. These APIs have been deprecated since iOS 10, and we believe we’ve given app developers enough time to use the modern APIs. Make sure you transition to the [`UserNotifications` framework](https://developer.apple.com/documentation/usernotifications?language=objc) as soon as possible.

**Please note that for React Native apps, [`PushNotificationIOS` (`RCTPushNotificationManager`)](https://facebook.github.io/react-native/docs/pushnotificationios) is severely outdated and does not support these modern APIs.** It is recommended to transition to a more modern solution. While it is sad that such an important app feature is let to stagnate so much by Facebook, it cannot be the concern of Detox. It is up to RN users to keep their apps up to date with the latest Apple APIs.

Our [own React Native notifications solution](https://github.com/wix/react-native-notifications) supports these modern APIs.

See [#1514](https://github.com/wix/Detox/issues/1514).
