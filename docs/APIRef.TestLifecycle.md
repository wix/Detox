---
id: test-lifecycle
slug: api/test-lifecycle
title: Test Lifecycle
sidebar_label: Test Lifecycle
---

## Test Lifecycle

TODO: re-write this (!!!) for Jest Circus.

### Initial Setup

...

### Before and After Each Test

...

### Teardown

...

### Repeating Setup for All Tests

A good practice for testing in general is to have decoupled tests, meaning that each test has the same starting point, and the tests can run in any order and still produce the same results. We strongly encourage either restarting your application or restart react-native (if your application is built with it).

#### Reloading React Native

```js
  beforeEach(async () => {
    await device.reloadReactNative();
  });
```

#### Relaunching the Entire App

```js
  beforeEach(async () => {
    await device.launchApp({newInstance: true});
  });
```
