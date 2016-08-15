GREYDispatchQueueIdlingResource:
  + (instancetype)resourceWithDispatchQueue:(dispatch_queue_t)queue name:(NSString *)name;
  we need dispatch_queue_t
  + (instancetype)resourceWithNSOperationQueue:(NSOperationQueue *)queue name:(NSString *)name;
  we need NSOperationQueue

enqueueJSCall

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  if ([NSThread currentThread] != _javaScriptThread) {
    [self performSelector:@selector(executeBlockOnJavaScriptQueue:)
                 onThread:_javaScriptThread withObject:block waitUntilDone:NO];
  } else {
    block();
  }
}

1. CFRunLoopIsWaiting ?? - the JS thread is a thread, it isn't a GCD queue so it's hard
This function is useful only to test the state of another thread’s run loop. When called with the current thread’s run loop, this function always returns false.
#import "Additions/NSRunLoop+GREYAdditions.h"

http://tadeuzagallo.com/blog/react-native-bridge/


RCTFrameUpdateObserver - a react native module can ask to receive a callback before every frame is drawn to screen (using CADisplayLink)

2. RCTTiming.m
maybe listen in on all timers in the system and add EarlGrey monitors to them

RCT_PROFILE_BEGIN_EVENT
RCT_PROFILE_END_EVENT
we can maybe enable profiling and listen on RCTProfileGetQueue()

flushedQueue (js)

dispatch_queue_create("com.facebook.react.RCTBridgeQueue", DISPATCH_QUEUE_CONCURRENT);

_pendingCalls

enqueueJSCall

char *const RCTUIManagerQueueName = "com.facebook.react.ShadowQueue";
RCTGetUIManagerQueue
_pendingUIBlocks

if (![_bridge isBatchActive])

MessageQueue.js
flushedQueue()
Systrace.counterEvent('pending_js_to_native_queue', this._queue[0].length);

RCTJSThread

[self executeBlockOnJavaScriptQueue:^{
    BOOL enabled = [notification.name isEqualToString:RCTProfileDidStartProfiling];
    [_bridge enqueueJSCall:@"Systrace.setEnabled" args:@[enabled ? @YES : @NO]];
  }];

JSEvaluateScript

addSynchronousHookWithName
// can make a JS function that when executes, runs native code synchronously and gets a return value from native

InteractionManager.runAfterInteractions
* - requestAnimationFrame(): for code that animates a view over time.
* - setImmediate/setTimeout(): run code later, note this may delay animations.
* - runAfterInteractions(): run code later, without delaying active animations.

BatchedBridge.js getEventLoopRunningTime() - see how much time passed after last flush

JSTimersExecution.js
JSTimersExecution.Type.requestIdleCallback
callImmediatesPass() return JSTimersExecution.immediates.length > 0

requestAnimationFrame - is a polyfill from the browser that you might be familiar with. It accepts a function as its only argument and calls that function before the next repaint

ReactAndroid/src/androidTest/java/com/facebook/react/testing/ReactIdleDetectionUtil.java
* Waits for both the UI thread and bridge to be idle. It determines this by waiting for the
* bridge to become idle, then waiting for the UI thread to become idle, then checking if the
* bridge is idle again (if the bridge was idle before and is still idle after running the UI
* thread to idle, then there are no more events to process in either place).

NSRunLoop *targetRunLoop = [_javaScriptExecutor isKindOfClass:[RCTJSCExecutor class]] ? [NSRunLoop currentRunLoop] : [NSRunLoop mainRunLoop];
    [_displayLink addToRunLoop:targetRunLoop];

GREYUIWebViewIdlingResource.m
* this is an implementation by EarlGrey that waits on a webview until it becomes idle
* we can do a very similar concept
