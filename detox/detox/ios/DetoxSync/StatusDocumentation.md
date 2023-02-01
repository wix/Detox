# Synchronization Status Documentation

DetoxSync provides the `+[DTXSyncManager statusWithCompletionHandler:]` method as means to query the sync system’s status. The completion handler is called with a JSON object, describing the status. 

[Detox](https://github.com/wix/Detox) uses this API to drive its `--debug-synchronization` implementation.

A typical response looks like this:

```
{
  "app_status": "busy",
  "busy_resources": [
    {
      "name": "run_loop",
      "description": {
        "name": "Main Run Loop"
      }
    },
    {
      "name": "ui",
      "description": {
        "layer_animation_pending_count": 2
        "layer_needs_layout_count": 1,
        "layer_pending_animation_count": 3,
        "view_animation_pending_count": 2
      }
    }
  ]
}
```

Each item of the `busy_resources` describes a busy sync resource, along with availble description of the resource, attempting to shed more light on why the resource is busy.

This document aims to describe each resource the sync system tracks, how it is tracked and what can cause it to become busy.

## Sync Resources

### Delayed Perform Selector

This sync resource tracks Objective C selectors scheduled to run in the future, using API such as `-[NSObject performSelector:withObject:afterDelay:]`. Such delayed selectors are tracked for run loops that are tracked by the system.

A typical busy resource representation:

```
{
  "name": "delayed_perform_selector",
  "description": {
    "pending_selectors": 2
  }
}
```

Once all pending selectors have been called, this sync resource becomes idle.

### Dispatch Queue

This sync resource tracks [dispatch queues](https://developer.apple.com/documentation/dispatch/dispatch_queue?language=objc) and their [work items](https://developer.apple.com/documentation/dispatch/dispatch_work_item?language=objc). Once a work item is submitted to a tracked dispatch queue, the sync resource is considered busy.

A typical busy resource representation:

```
{
  "name": "dispatch_queue",
  "description": {
    "queue": "Main Queue (<OS_dispatch_queue_main: com.apple.main-thread>)",
    "works_count": 3
  }
}
```

Once all pending work items have been executed, the sync resource becomes idle.

### Run Loop

The run loop sync resource tracks [run loops](https://developer.apple.com/documentation/foundation/nsrunloop) and their states. A run loop is considered idle if it is waiting for their monitored sources. Once the run loop wakes up due to one of its sources, it is considered busy.

During the normal lifecycle of an app, its run loops normally switch often between busy and idle states, and no special significance should be paid to a busy run loop, as it is usually accompanied by other busy sync resources, which better describe what the system is doing.

A typical busy resource representation:

```
{
  "name": "run_loop",
  "description": {
    "name": "Main Run Loop"
  }
}
```

### One-time Event

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

A typical busy resource representation:

```
{
  "name": "one_time_events",
  "description": {
    "event": "Network Request",
    "object": "URL: “https://jsonplaceholder.typicode.com/todos/1”"
  }
}
```

This sync resource is considered idle once all tracked one-time events are finished.

### Timer

This sync resource tracks [run loop timers](https://developer.apple.com/documentation/foundation/nstimer) and [display links](https://developer.apple.com/documentation/quartzcore/cadisplaylink). Once a timer or display link is scheduled with a tracked run loop, it is automatically tracked by the system, and the sync resource becomes busy.

A typical busy resource representation:

```
{
  "name": "timers",
  "description": {
    "timers": [
      {
        "fire_date": "2021-11-02 14:37:30 +0200",
        "time_until_fire": "0.9999970197677612",
        "repeat_interval": 0,
        "is_recurring": false
      },
      {
        "fire_date": "2021-11-02 14:37:30 +0200",
        "time_until_fire": "1.499961972236633",
        "repeat_interval": 0,
        "is_recurring": false
      },
      {
        "fire_date": "2021-11-02 14:37:30 +0200",
        "time_until_fire": "0.9999980926513672",
        "repeat_interval": 0,
        "is_recurring": false
      }
    ]
  }
}
```

For timers, the idle status descriptions provides the fire date (in system time zone), the time until fire, whether the timer is recurring and its repeat interval. For display links, it displays the object description.

The sync resource is considered idle once all tracked timers are either cancelled or fired, and are no longer tracked.

### UI Elements

This sync resource tracks [views](https://developer.apple.com/documentation/uikit/uiview?language=objc), [their controller](https://developer.apple.com/documentation/uikit/uiviewcontroller?language=objc), [layers](https://developer.apple.com/documentation/quartzcore/calayer?language=objc), lifecycle and animations.

Tracked event categories include:

- View display (draw) and layout
- Layer display and layout
- View controller appearance and disappearance
- View animations
- CA (layer) animations
- Layers pending animation

Each event category is tracked independently, and the system is considered busy if at least one event exists in any category.

Depending on the depth of the view hierarchy, view and layer display & layout counts can appear large, but those are typically untracked soon after they are needed. Controller appearance is usually tied to a transition animation. View and CA animations depend on the delay and duration provided by the developer, as well as animations set to repeat. 

**Due to the decentralized nature of view and CA animations, it is impossible to provide precise information of which view or layer are being animated. It is up to developers to be familiar with their apps.** Certain special views, such as [activity indicator views](https://developer.apple.com/documentation/uikit/uiactivityindicatorview?language=objc), can infinitely animate when displayed, and will keep the system busy. Ensure your app removes them when idle, or stops their animation.

A typical busy resource representation:

```
{
  "name": "ui",
  "description": {
    "layer_animation_pending_count": 2,
    "layer_needs_display_count": 1,
    "layer_needs_layout_count": 1,
    "layer_pending_animation_count": 3,
    "view_animation_pending_count": 2,
    "view_controller_will_appear_count": 1,
    "view_controller_will_disappear_count": 1,
    "view_needs_display_count": 1,
    "view_needs_layout_count": 1
  }
}
```

The sync resource is considered idle when there are no active events in all categories.

### JS Timer

This sync resource tracks JS timers in React Native applications, started with the `setTimeout()` or `setInterval()` APIs.
When a JS timer is started, it is automatically tracked by the system, and the sync resource becomes busy.

A typical busy resource representation:

```
{
  "name": "js_timers",
  "description": {
    "timers": [
      {
        "timer_id": 13,
        "duration": 3,
        "is_recurring": false
      },
      {
        "timer_id": 24,
        "duration": 10,
        "is_recurring": true
      }
    ]
  }
}
```

For each JS timer, the timer ID is printed, as returned by `setTimeout()`. You can use this ID to investigate where in your code the timer was started.

The sync resource is considered idle once all tracked timers are either cancelled or fired, and are no longer tracked.
