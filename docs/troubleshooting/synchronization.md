# Dealing With Synchronization Issues in Tests

<!-- markdownlint-configure-file { "header-increment": 0 } -->

Traditionally, one of the most difficult aspects of E2E testing is synchronizing the test scenario with the app. Complex operations inside the app (like accessing servers or performing animations) often take a variable amount of time to complete; In each step, we can’t move on to the next one until they’ve completed (i.e. when the app goes idle), which in turn surfaces a challenge in continously trying to understand when the right time to do so is.

Fortunately, Detox - which comes with a gray-box approach, cleverly performs the synchronization automatically, as explained [here](../articles/how-detox-works.md#how-detox-automatically-synchronizes-with-your-app).

## Debugging the Automated Synchronization Mechanism

While Detox's auto-synchronization mechanism is powerful and efficient, it does come with at least one caveat: **It imposes strictness over the app's behavior.** By default, Detox will fail your tests (i.e. due to a wait-for-idle timeout), if, for example, following an app launch or a navigation to a new screen, timers or animations continue to run endlessly. While this could be considered an advantage (e.g. finding an animation or timer management leakage!), these type of issues may not:

1. Be specifially related to the main coverage goal of your test.
2. Be directly visible to or considered a bug by the end user.

Therefore, it may be something some would want to be able to opt-out of.

### Step 1: Understanding what's blocking Detox

Detox's [syncrhonization debugging mechanism](../config/session.mdx#sessiondebugsynchronization-number) generates output to Detox's log which provides useful information. We recommend reading about it in order to understand how it can be useful in synchronization debugging, before anything else.

#### (Optional) Lower-level Idling Resources Debug (iOS Only)

If the synchronization debugging mechanism does not provide the necessary information, on iOS you can add the following launch argument to your app (using `launchArgs` in your `launchApp()` call) to enable a very verbose logging of the idling resource system to the system log:

```plain text
-DTXEnableVerboseSyncSystem YES -DTXEnableVerboseSyncResources YES
```

You can then obtain this log by running the following command:

```bash
xcrun simctl spawn booted log stream --level debug --style compact --predicate "category=='SyncManager'"
```

For example, change your `device.launchApp()` call like:

```js
await device.launchApp({
  newInstance: true,
  launchArgs: { 'DTXEnableVerboseSyncSystem': 'YES', 'DTXEnableVerboseSyncResources': 'YES' },
});
```

### Step 2: Apply the Most Suitable Solution

#### Switching to manual synchronization as a workaround

We always have the fail-safe of turning off automatic synchronization and waiting manually by ourselves. This isn’t the recommended approach, but sometimes we don’t have a choice.

#### How do we turn off automatic synchronization?

This makes sense only if we’re waiting too much.

##### [Controlling the entire synchronization mechanism](../api/device.md#devicedisablesynchronization)

The synchronization mechanism can be shut down using

```js
await device.disableSynchronization();
```

to turn it on again use

```js
await device.enableSynchronization();
```

##### [Controlling network synchronization](../api/device.md#deviceseturlblacklisturls)

You can skip over synchronizing on certain URLs (for long polling tasks, or websocket connections)

```js
await device.setURLBlacklist(['.*127.0.0.1.*']);
```

In order to gain sync back on an endpoint, just remove it from the blacklist:

```js
await device.setURLBlacklist([]);
```

Alternatively, you can launch your app already with the URL blacklist defined — that can help with a network sync issue at the very beginning:

```js
await device.launchApp({
  launchArgs: {
    detoxURLBlacklistRegex: '(".*example.com/some-url/.*")',
  },
});
```

#### How do we wait manually?

This makes sense only if we’re not waiting enough (or if we’ve disabled automatic synchronization). Use the `withTimeout()` API to wait until an expectation is met. The API is documented [here](../api/expect.md#withtimeouttimeout).

### Tweaking and fine-tuning the synchronization mechanisms

As of writing this, fine tuning is not supported. Check out issue [#1513](https://github.com/wix/Detox/issues/1513) to keep track of that.

### Modifying your app to avoid waiting too much

When facing a synchronization issue and tweaking doesn’t help, consider modifying your app. When Detox is having trouble synchronizing due to intense non-stopping activity, it may be a sign that your app is abusing resources.

You can also modify your app, for the sake of tests only, by using mocking. Read more [here](../guide/mocking.md).

#### `setTimeout` and `setInterval`

By default, Detox is designed to ignore `setInterval` and will only wait for `setTimeout` of up to 1.5 seconds. If you have an endless polling loop with short intervals implemented with `setTimeout`, switch the implementation to `setInterval`. If possible, avoid aggressive polling in your app altogether, the poor single JavaScript thread we have doesn’t like it.

#### Endless looping animations

By default, Detox will wait until animations complete. If you have an endless looping animation, this may cause Detox to hang. In this case, consider turning off the animation synchronization or remove the endless loop in your E2E build with [mocking](../guide/mocking.md).
