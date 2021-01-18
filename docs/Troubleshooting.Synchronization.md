# Dealing With Synchronization Issues in Tests

Traditionally, one of the most difficult aspects of E2E testing is synchronizing the test scenario with the app. Complex operations inside the app (like accessing servers or performing animations) often take variable amount of time to complete. We can't continue the test until they've completed. How can we synchronize the test with these operations?

Synchronizing manually with `sleep()` commands is a bad idea. It's flaky, complicates the tests, behaves differently on different machines and makes tests needlessly slow.

Instead, Detox tries to synchronize the test with the app completely *automatically*.

When this works it's like magic. You simply execute actions one after the other without worrying about timing, and Detox waits for the app to stabilize before moving to the next test line. If there's an in-flight request to a server, for example, the test will not move forward until the request completes.

### What operations do we try to synchronize with automatically

* **Network requests** - Detox monitors in-flight requests over the network.

* **Main thread (native)** - Detox monitors pending native operations on the main thread (main dispatch queue and main NSOperationQueue).

* **Layout of UI** - Detox monitors UI layout operations. There's also special support for React Native layout which includes the Shadow Queue where [yoga](https://github.com/facebook/yoga) runs.

* **Timers** - Detox monitors timers (explicit asynchronous delays). There's special support for JavaScript timers like setTimeout and setInterval.

* **Animations** - Detox monitors active animations and transitions. There's special support for React Native animations with the Animated library.

* **React Native JavaScript thread** - Detox monitors pending operations on the JavaScript thread in RN apps.

* **React Native bridge** - Detox monitors the React Native bridge and asynchronous messages sent on it.

### Automatic synchronization works most of the time

It's difficult for an automatic mechanism to be correct in 100% of the cases. There are always exceptions. We are optimizing for the common case so most of your scenarios will not have to deal with synchronization issues.

For the rest of this tutorial, we'll assume the test is having some sort of a synchronization issue.

### Are we waiting too much or not waiting enough?

When the automatic synchronization mechanism doesn't work, we have 2 potential problems:

* We are waiting too much - The test will appear to hang and fail with timeout. This happens because Detox thinks an asychronous operations is currently taking place and is waiting for it endlessly.

* We are not waiting enough - The test will appear to fail at some point because an element isn't found according to an expectation or isn't found when attempting to perform an action on it. This happens because Detox didn't take some asynchronous operation into account and isn't waiting until it completes.

### Identifying which synchronization mechanism causes us to wait too much

Interactions with the application are synchronized, meaning that they will not execute unless the app is idle. You may encounter situations where the tests just hang. 
When an action/expectation takes a significant amount of time use this option to print device synchronization status.
The status will be printed if the action takes more than [value] (in ms) to complete

```
detox test --debug-synchronization 500
```
Then, reproduce your issue, and you should see output similar to the following:

```
18:11:41 detox[15415] INFO:  [actions.js] The system is busy with the following tasks:
18:11:41 
18:11:41 Dispatch Queue
18:11:41 ⏱ Queue: “Main Queue (<OS_dispatch_queue_main: com.apple.main-thread>)” with 1 work item
18:11:41 
18:11:41 Run Loop
18:11:41 ⏱ “Main Run Loop”
18:11:41 
18:11:41 One-time Events
18:11:41 ⏱ “Network Request” with object: “URL: “http://localhost:9001/delay/3000””
```

See [this document](https://github.com/wix/DetoxSync/blob/master/IdleStatusDocumentation.md) for documentation of the synchronization debut output.

#### Lower-level Idling Resources Debug (iOS Only)

If `--debug-synchronization` does not provide the necessary information, on iOS you can add the following launch argument to your app (using `launchArgs` in your `launchApp()` call) to enable a very verbose logging of the idling resource system to the system log:

```shell
-DTXEnableVerboseSyncSystem YES -DTXEnableVerboseSyncResources YES
```

You can then obtain this log by running the following command:

```shell
xcrun simctl spawn booted log stream --level debug --style compact --predicate "category=='SyncManager'"
```

For example, change your `/e2e/init.js` like so:

```js
await detox.init(undefined, { launchApp: false });
await device.launchApp({
  newInstance: true,
  launchArgs: { 'DTXEnableVerboseSyncSystem': 'YES', 'DTXEnableVerboseSyncResources': 'YES' }
});
```

### Switching to manual synchronization as a workaround

We always have the fail-safe of turning off automatic synchronization and waiting manually by ourselves. This isn't the recommended approach but sometimes we don't have a choice.

#### How do we turn off automatic synchronization?

This makes sense only if we're waiting too much. 

##### [Controlling the entire synchronization mechanism](https://github.com/wix/detox/blob/master/docs/APIRef.DeviceObjectAPI.md#devicedisablesynchronization)
The synchronization mechanism can be shut down using

```js
await device.disableSynchronization();
```

to turn it on again use

```js
await device.enableSynchronization();
```

##### [Controlling network synchronization](https://github.com/wix/detox/blob/master/docs/APIRef.DeviceObjectAPI.md#deviceseturlblacklisturls) 
You can skip over synchronizing on certain URLs (for long polling tasks, or websocket connections)

```js
await device.setURLBlacklist(['.*127.0.0.1.*']);
```

In order to gain sync back on an endpoint, just remove it from the blacklist

```js
await device.setURLBlacklist([]);
```


#### How do we wait manually?

This makes sense only if we're not waiting enough (or if we've disabled automatic synchronization). Use the `withTimeout()` API to wait until an expectation is met. The API is documented [here](/docs/APIRef.Expect.md#withtimeouttimeout).

### Tweaking and fine-tuning the synchronization mechanisms

> This isn't exposed yet, TBD

### Modifying your app to avoid waiting too much

When facing a synchronization issue and tweaking doesn't help, consider modifying your app. When Detox is having trouble synchronizing due to intense non-stopping activity, it may be a sign that your app is abusing resources.

You can also modify your app, for the sake of tests only, by using mocking. Read more [here](https://github.com/wix/Detox/blob/master/docs/Guide.Mocking.md).

#### setTimeout and setInterval

By default, Detox is designed to ignore `setInterval` and will only wait for `setTimeout` of up to 1.5 seconds. If you have an endless polling loop with short intervals implemented with `setTimeout`, switch the implementation to `setInterval`. If possible, avoid agressive polling in your app altogether, the poor single JavaScript thread we have doesn't like it.

#### Endless looping animations

By default, Detox will wait until animations complete. If you have an endless looping animation, this may cause Detox to hang. In this case, consider turning off the animation synchronization or remove the endless loop in your E2E build with [mocking](https://github.com/wix/Detox/blob/master/docs/Guide.Mocking.md).
