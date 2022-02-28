---
id: backdoors
slug: guide/backdoors
title: Backdoors
sidebar_label: Backdoors
---

## Backdoors

Detox provides a backdoor feature that makes it possible for tests to send
arbitrary messages to the app being tested for the purpose of configuring
state or running any other special actions.

### Usage

#### In your test

```tsx
await device.backdoor({ action: "do-something" });
```

#### In your app

```tsx
const emitter = Platform.OS === "ios" ? NativeAppEventEmitter : DeviceEventEmitter;
emitter.addListener("detoxBackdoor", ({ action }) => {
  // do something based on action
});
```
