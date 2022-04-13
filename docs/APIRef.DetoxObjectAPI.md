---
id: detox-object-api
slug: api/detox-object-api
title: Detox Object API
sidebar_label: The `detox` Object
---

## The `detox` Object

TODO: rewrite this document

### Methods

- [`detox.traceCall()`](#detoxtracecall)
- [`detox.trace.startSection(), detox.trace.endSection()`](#detoxtracestartsection-detoxtraceendsection)

#### `detox.traceCall()`

:warning: **Beta**

Trace a subprocess of your test’s runtime such that it would leave traces inside the [Timeline artifact](APIRef.Artifacts.md#timeline-plugin), for a later inspection.

Example:

```js
it('Verify sanity things', async () => {
  // Instead of this typical direct call:
  // await element(by.id('sanityButton')).tap()
  
  // Use traceCall() as a wrapper:
  await detox.traceCall('Navigate to sanity', () =>
    element(by.id('sanityButton')).tap());
});
```

This would have the `tap` action traced to the final artifact, so it would look something like this:

![User event](img/timeline-artifact-userEvent.png)

At the bottom right, you can see what portion of the test was spent in handling the whole navigation process: tap + screen push + screen rendering (i.e. action time, alongside Detox' inherent wait for the application to become idle).

#### `detox.trace.startSection(), detox.trace.endSection()`

:warning: **Beta**

This is similar to the `traceCall()` API, except that it gives more freedom with respect to when a section’s start and ending times are defined, so as to monitor a nontrivial flow. As a usage example:

```js
it('Verify sanity things', async () => {
  try {
    detox.trace.startSection('Turn off notifications');
    await element(by.id('gotoNotifications')).tap();
    await element(by.id('notificationsToggle')).tap();
    await device.pressBack();    
  } finally {
    detox.trace.endSection('Turn off notifications');    
  }
});
```

Effectively, `start` and `end` can even be called in two complete different places - such as a `before` and an `after`. But that is discouraged. In fact, **usage of `detox.traceCall()` is the recommended way of tracing things, altogether.**
