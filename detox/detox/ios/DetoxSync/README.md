# DetoxSync

DetoxSync is a synchronization framework for Detox and other testing frameworks, where there app synchronization is needed. 

DetoxSync tracks various application states (resources), such as animations, network requests and dispatch queues, and is able to execute blocks whenever the system is deemed idle. The idle status of the system can be queried using a dedicated API. The system also provides a detailed event reporting through its delegate methods.

### Tracked Resources

#### Delayed Perform Selectors

This sync resource tracks Objective C selectors scheduled to run in the future, using API such as `-[NSObject performSelector:withObject:afterDelay:]`. Such delayed selectors are tracked for run loops that are tracked by the system.

Once all pending selectors have been called, this sync resource becomes idle.

#### Dispatch Queues

This sync resource tracks [dispatch queues](https://developer.apple.com/documentation/dispatch/dispatch_queue?language=objc) and their [work items](https://developer.apple.com/documentation/dispatch/dispatch_work_item?language=objc). Once a work item is submitted to a tracked dispatch queue, the sync resource is considered busy.

Once all pending work items have been executed, the sync resource becomes idle.

#### Run Loops

The run loop sync resource tracks [run loops](https://developer.apple.com/documentation/foundation/nsrunloop) and their states. A run loop is considered idle if it is waiting for their monitored sources. Once the run loop wakes up due to one of its sources, it is considered busy.

During the normal lifecycle of an app, its run loops normally switch often between busy and idle states, and no special significance should be paid to a busy run loop, as it is usually accompanied by other busy sync resources, which better describe what the system is doing.

#### One-time Events

One-time events are single, one-off events which start at some point during the lifetime of the app, and once finished, are released. The system is considered idle if no such events are currently tracked.

One-time events include:

- Network requests
- Special animations
- Special application modes
- Gesture recognizer handling
- Scrolling
- Special run loop operations
- React Native load
- User provided custom events

Each one-time event description may include an object and/or other identifiable information to help hint what the event is.

This sync resource is considered idle once all tracked one-time events are finished.

#### Timers

This sync resource tracks [run loop timers](https://developer.apple.com/documentation/foundation/nstimer) and [display links](https://developer.apple.com/documentation/quartzcore/cadisplaylink). Once a timer or display link is scheduled with a tracked run loop, it is automatically tracked by the system, and the sync resource becomes busy.

The sync resource is considered idle once all tracked timers are either cancelled or fired, and are no longer tracked.

#### UI Elements

Tracked event categories include:

- View display (draw) and layout
- Layer display and layout
- View controller appearance and disappearance
- View animations
- CA (layer) animations
- Layers pending animation

Each event category is tracked independently, and the system is considered busy if at least one event exists in any category.

The sync resource is considered idle when there are no active events in all categories.

#### JS Timers

This sync resource tracks JS timers in React Native applications, started with the `setTimeout()` API. When a JS timer is started, it is automatically tracked by the system, and the sync resource becomes busy.

The sync resource is considered idle once all tracked timers are either cancelled or fired, and are no longer tracked.

### Sync Status

The sync status of the system can be queried using the `+[DTXSyncManager statusWithCompletionHandler:]` method. For more information of the returned syntax, see [Sync Status Documentation](StatusDocumentation.md).

### React Native

DetoxSync comes with React Native support out of the box, automatically tracking React Native bundle load, the React Native JavaScript run loop, its internal dispatch queues and the dispatch queues of all native modules. When a React Native bridge is reloaded, the system automatically untracks the previous run loop and any associated dispatch queues.

### API Documentation

For most up-to-date documentation, check out the [DTXSyncManager header](https://github.com/wix/DetoxSync/blob/master/DetoxSync/DetoxSync/SyncManager/DTXSyncManager.h).
