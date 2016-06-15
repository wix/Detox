//
// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

#import "Synchronization/GREYUIThreadExecutor.h"

#import "Additions/NSError+GREYAdditions.h"
#import "Additions/UIApplication+GREYAdditions.h"
#import "AppSupport/GREYIdlingResource.h"
#import "Assertion/GREYAssertionDefines.h"
#import "Common/GREYConfiguration.h"
#import "Common/GREYConstants.h"
#import "Common/GREYDefines.h"
#import "Synchronization/GREYAppStateTracker.h"
#import "Synchronization/GREYDispatchQueueIdlingResource.h"
#import "Synchronization/GREYOperationQueueIdlingResource.h"

// Extern.
NSString *const kGREYUIThreadExecutorErrorDomain =
    @"com.google.earlgrey.GREYUIThreadExecutorErrorDomain";

// The number of times idling resources are queried for idleness to be considered "really" idle.
// The value used here has worked in practice and has negligible impact on performance.
static int kConsecutiveTimesIdlingResourcesMustBeIdle = 3;

// Execution states.
typedef NS_ENUM(NSInteger, EGExecutionState) {
  kGREYExecutionNotStarted = -1,
  kGREYExecutionWaitingForIdle,
  kGREYExecutionCompleted,
  kGREYExecutionTimeoutIdlingResourcesAreBusy,
  kGREYExecutionTimeoutAppIsBusy,
};

@interface GREYUIThreadExecutor ()
// Property added for unit tests to skip monitoring the default idling resources.
@property(nonatomic, assign) BOOL shouldSkipMonitoringDefaultIdlingResourcesForTesting;
@end

@implementation GREYUIThreadExecutor {
  /**
   *  All idling resources that are registered with the framework using
   *  EGUIThreadExecutor::registerIdlingResource:. This list excludes the idling resources that are
   *  monitored by default and don't require registration.
   */
  NSMutableSet *_registeredIdlingResources;
  /**
   *  A weak collection of all (default and registered) idling resources that are in non-idle state.
   *  It is not safe to access this outside the main thread.
   */
  NSHashTable *_busyIdlingResources;
  /**
   *  Idling resources that are monitored by default and cannot be deregistered.
   */
  id<GREYIdlingResource> _defaultMainDispatchQIdlingResource;
  id<GREYIdlingResource> _defaultMainNSOperationQIdlingResource;
}

+ (instancetype)sharedInstance {
  static GREYUIThreadExecutor *instance = nil;
  static dispatch_once_t token = 0;
  dispatch_once(&token, ^{
    instance = [[GREYUIThreadExecutor alloc] initOnce];
  });
  return instance;
}

/**
 *  Initializes the thread executor. Not thread-safe. Must be invoked under a race-free synchronized
 *  environment by the caller.
 *
 *  @return The initialized instance.
 */
- (instancetype)initOnce {
  self = [super init];
  if (self) {
    _registeredIdlingResources = [[NSMutableSet alloc] init];
    _busyIdlingResources = [NSHashTable weakObjectsHashTable];
    // Create default idling resources that are always monitored.
    _defaultMainNSOperationQIdlingResource =
        [GREYOperationQueueIdlingResource resourceWithNSOperationQueue:[NSOperationQueue mainQueue]
                                                                  name:@"Main NSOperation Queue"];
    _defaultMainDispatchQIdlingResource =
        [GREYDispatchQueueIdlingResource resourceWithDispatchQueue:dispatch_get_main_queue()
                                                              name:@"Main Dispatch Queue"];
  }
  return self;
}

- (void)drainOnce {
  @autoreleasepool {
    NSError *ignoreError;
    [self executeSyncWithTimeout:0 block:nil error:&ignoreError];
  }
}

- (void)drainForTime:(CFTimeInterval)seconds {
  NSParameterAssert(seconds >= 0);

  @autoreleasepool {
    CFTimeInterval drainUntilTime = CACurrentMediaTime() + seconds;
    CFTimeInterval currentTime;
    do {
      [self drainOnce];
      currentTime = CACurrentMediaTime();
    } while (currentTime < drainUntilTime);
  }
}

- (void)drainUntilIdle {
  [self executeSyncWithTimeout:kGREYInfiniteTimeout block:nil error:nil];
}

- (BOOL)drainUntilIdleWithTimeout:(CFTimeInterval)seconds {
  NSError *ignoreError;
  return [self executeSyncWithTimeout:seconds block:nil error:&ignoreError];
}

- (BOOL)executeSync:(GREYExecBlock)execBlock error:(__strong NSError **)error {
  return [self executeSyncWithTimeout:kGREYInfiniteTimeout block:execBlock error:error];
}

- (BOOL)executeSyncWithTimeout:(CFTimeInterval)seconds
                         block:(GREYExecBlock)execBlock
                         error:(__strong NSError **)error {
  I_CHECK_MAIN_THREAD();
  NSParameterAssert(seconds >= 0);

  __block BOOL areAllResourcesIdle = NO;
  __block BOOL isAppIdle = NO;
  // Calculate timeout.
  CFTimeInterval timeoutTime = CACurrentMediaTime() + seconds;
  BOOL timedOut = NO;
  BOOL isSynchronizationDisabled = !GREY_CONFIG_BOOL(kGREYConfigKeySynchronizationEnabled);
  __block EGExecutionState executionState = kGREYExecutionNotStarted;
  // Loop until block is executed or a timeout occurs.
  do {
    @autoreleasepool {
      // Drain the runloop before evaluating states because a pending state change might take
      // effect only after a drain.
      [self grey_drainInActiveRunLoopMode];

      CFStringRef mode = (__bridge CFStringRef)[self grey_activeRunLoopMode];
      // Use CFRunLoopPerformBlock to enqueue the block because:
      // 1) We want to run the block in the topmost active runloop mode because that's what the
      //    the app does when run standalone.
      // 2) We synchronize with dispatch queues and using any dispatch queue APIs for executing
      //    the block will leads to livelock.
      // 3) According to CFRunLoop's implementation, perform blocks are executed at a much higher
      //    rate than any other sources. This minimizes the time-gap between checking for idleness
      //    and actual execution of the block.
      CFRunLoopPerformBlock(CFRunLoopGetCurrent(), mode, ^{
        BOOL shouldExecuteBlock;
        if (isSynchronizationDisabled) {
          shouldExecuteBlock = YES;
        } else {
          // Ensure idleness consecutively. This is a sloppy way to mitigate flakiness that may be
          // caused by idling resource affecting each other's state when they're queried for
          // idleness.
          for (int i = 0; i < kConsecutiveTimesIdlingResourcesMustBeIdle; i++) {
            areAllResourcesIdle = [self grey_areAllResourcesIdle];
            if (!areAllResourcesIdle) {
              break;
            }
          }
          isAppIdle = [[GREYAppStateTracker sharedInstance] isIdle];
          shouldExecuteBlock = (areAllResourcesIdle && isAppIdle);
        }

        executionState = kGREYExecutionWaitingForIdle;
        if (shouldExecuteBlock) {
          if (execBlock) {
            execBlock();
          }
          executionState = kGREYExecutionCompleted;
        }
      });
      // Drain the runloop run long enough to execute the block.
      CFRunLoopRunInMode(mode, 0, true);
      NSAssert((executionState == kGREYExecutionCompleted) ||
               (executionState == kGREYExecutionWaitingForIdle),
               @"Execution not complete after draining the runloop once.");

      CFTimeInterval currentTime = CACurrentMediaTime();
      timedOut = (seconds != kGREYInfiniteTimeout) && (currentTime >= timeoutTime);
      if ((executionState != kGREYExecutionCompleted) && timedOut) {
        // TODO: This doesn't take into account possibilities of both idling resources and app
        // not being in idle state. When this happens, either one of the two is reported to the user
        // not both.
        if (!areAllResourcesIdle) {
          executionState = kGREYExecutionTimeoutIdlingResourcesAreBusy;
        } else if (!isAppIdle) {
          executionState = kGREYExecutionTimeoutAppIsBusy;
        } else {
          NSAssert(NO, @"Should not timeout if both the App and the idling resources are idle.");
        }
      }
    }
  } while (executionState == kGREYExecutionWaitingForIdle);

  switch (executionState) {
    case kGREYExecutionTimeoutAppIsBusy: {
      NSString *reason = @"Failed to execute block because App is not idle. "
                         @"Perhaps an animation or network request is ongoing for an "
                         @"indefinite period of time?";
      NSString *details =
          [NSString stringWithFormat:@"Waiting for terminal events for following App states:\n%@",
                                     [[GREYAppStateTracker sharedInstance] description]];
      [NSError grey_logOrSetOutReferenceIfNonNil:error
                                      withDomain:kGREYUIThreadExecutorErrorDomain
                                            code:kGREYUIThreadExecutorTimeoutErrorCode
                            andDescriptionFormat:@"%@\n%@", reason, details];
      return NO;
    }
    case kGREYExecutionTimeoutIdlingResourcesAreBusy: {
      NSMutableArray *busyResourcesNames = [[NSMutableArray alloc] init];
      NSMutableArray *busyResourcesDescription = [[NSMutableArray alloc] init];

      for (id<GREYIdlingResource> resource in _busyIdlingResources) {
        NSString *formattedResourceName =
            [NSString stringWithFormat:@"\'%@\'", [resource idlingResourceName]];
        [busyResourcesNames addObject:formattedResourceName];

        NSString *busyResourceDescription =
            [NSString stringWithFormat:@"  %@ : %@",
                                       [resource idlingResourceName],
                                       [resource idlingResourceDescription]];
        [busyResourcesDescription addObject:busyResourceDescription];
      }

      NSString *reason =
          [NSString stringWithFormat:@"Failed to execute block because the following "
                                     @"IdlingResources are busy: [%@]",
                                     [busyResourcesNames componentsJoinedByString:@", "]];
      NSString *details =
          [NSString stringWithFormat:@"Busy resource description:\n%@",
                                     [busyResourcesDescription componentsJoinedByString:@",\n"]];
      [NSError grey_logOrSetOutReferenceIfNonNil:error
                                      withDomain:kGREYUIThreadExecutorErrorDomain
                                            code:kGREYUIThreadExecutorTimeoutErrorCode
                            andDescriptionFormat:@"%@\n%@", reason, details];
      return NO;
    }
    case kGREYExecutionCompleted: {
      return YES;
    }
    case kGREYExecutionNotStarted:
      // fall-through.
    case kGREYExecutionWaitingForIdle: {
      NSAssert(NO, @"Execution must be in a terminal state. "
                   @"Did the do-while loop exit for some other reason while execution "
                   @"was still pending or not-started?\nisAppIdle:%d\nallResourcesIdle:%d",
                   isAppIdle, areAllResourcesIdle);
      return NO;
    }
  }
}

/**
 *  Register the specified @c resource to be checked for idling before executing test actions.
 *  A strong reference is held to @c resource until it is deregistered using
 *  @c deregisterIdlingResource. It is safe to call this from any thread.
 *
 *  @param resource The idling resource to register.
 */
- (void)registerIdlingResource:(id<GREYIdlingResource>)resource {
  NSParameterAssert(resource);
  @synchronized(_registeredIdlingResources) {
    [_registeredIdlingResources addObject:resource];
  }
}

/**
 *  Unregisters a previously registered @c resource. It is safe to call this from any thread.
 *
 *  @param resource The resource to unregistered.
 */
- (void)deregisterIdlingResource:(id<GREYIdlingResource>)resource {
  NSParameterAssert(resource);
  @synchronized(_registeredIdlingResources) {
    [_registeredIdlingResources removeObject:resource];
  }
}

#pragma mark - Internal Methods Exposed For Testing
/**
 *  @return @c YES when all idling resources are idle, @c NO otherwise.
 */
- (BOOL)grey_areAllResourcesIdle {
  I_CHECK_MAIN_THREAD();
  [self grey_updateBusyResources];
  return (0 == [_busyIdlingResources count]);
}

/**
 *  @returns Active mode for the main runloop.
 */
- (NSString *)grey_activeRunLoopMode {
  NSString *activeRunLoopMode = [[UIApplication sharedApplication] grey_activeRunLoopMode];
  if (!activeRunLoopMode) {
    activeRunLoopMode = [[NSRunLoop currentRunLoop] currentMode];
  }
  return activeRunLoopMode;
}

#pragma mark - Methods Only For Testing

- (void)grey_deregisterAllIdlingResources {
  @synchronized(_registeredIdlingResources) {
    [_registeredIdlingResources removeAllObjects];
  }
}

#pragma mark - Private

/**
 *  Updates the internal idle cache with state of all idling resources.
 */
- (void)grey_updateBusyResources {
  [_busyIdlingResources removeAllObjects];

  // Calling isIdleNow on one idling resource could affect the state of another idling resource.
  // We can't prevent that but we can mitigate some false-positives by checking the default idling
  // resources last, especially the dispatch queue because it is very likely for a previously
  // checked idling resource to add a task to the dispatch queue.
  @synchronized(_registeredIdlingResources) {
    // Resources are free to remove themselves or each-other when isIdleNow is invoked. For that
    // reason, iterator over a copy.
    for (id<GREYIdlingResource> resource in [_registeredIdlingResources copy]) {
      if (![resource isIdleNow]) {
        [_busyIdlingResources addObject:resource];
      }
    }
  }
  if (self.shouldSkipMonitoringDefaultIdlingResourcesForTesting) {
    return;
  }
  if (![_defaultMainNSOperationQIdlingResource isIdleNow]) {
    [_busyIdlingResources addObject:_defaultMainNSOperationQIdlingResource];
  }
  // Check the main dispatch queue last.
  if (![_defaultMainDispatchQIdlingResource isIdleNow]) {
    [_busyIdlingResources addObject:_defaultMainDispatchQIdlingResource];
  }
}

/**
 *  Spins the main runloop in top-most active runloop mode until all sources have had a fair chance
 *  of service.
 */
- (void)grey_drainInActiveRunLoopMode {
  @autoreleasepool {
    CFRunLoopSourceContext context;
    memset(&context, 0, sizeof(context));
    context.info = NULL;
    context.perform = grey_performSource0;
    CFRunLoopSourceRef source = CFRunLoopSourceCreate(NULL, 0, &context);
    CFStringRef mode = CFBridgingRetain([self grey_activeRunLoopMode]);
    CFRunLoopAddSource(CFRunLoopGetMain(), source, mode);

    __block int numCurrentRunLoopPasses = 0;
    __block int numNestedRunLoops = 0;
    void (^observerBlock) (CFRunLoopObserverRef observer, CFRunLoopActivity activity) =
        ^(CFRunLoopObserverRef observer, CFRunLoopActivity activity) {
          if (activity & kCFRunLoopEntry) {
            numNestedRunLoops++;
          } else if (activity & kCFRunLoopExit) {
            // This will be triggered after any (including nested) CFRunLoopRun call terminates.
            // Don't process the logic to increment numCurrentRunLoopPasses because it could
            // lead to abruptly stopping the runloop before it completes a full 2nd pass yet.
            numNestedRunLoops--;
            return;
          }

          // A nested call to CFRunLoopRun will cause multiple entries. Because we should only
          // stop the CFRunLoopRun call we make, we add this check to prevent stopping nested
          // CFRunLoopRun calls.
          if (numNestedRunLoops > 1) {
            return;
          }

          NSAssert(numNestedRunLoops >= 0,
                   @"entry/exit unbalanced. More exits than entries shouldn't be possible!");

          numCurrentRunLoopPasses++;
          NSAssert(numCurrentRunLoopPasses <= 2,
                   @"Current runloop should have been stopped on the 2nd pass!");
          // Keep the runloop from going to deep-sleep. This keeps it awake even if there are
          // no active sources for the runloop to process. Otherwise, runloop will sleep until
          // one of the sources is ready to fire.
          CFRunLoopSourceSignal(source);
          CFRunLoopWakeUp(CFRunLoopGetMain());
          // Stop the current runloop on the second pass.
          if (numCurrentRunLoopPasses == 2) {
            CFRunLoopStop(CFRunLoopGetMain());
          }
        };

    CFOptionFlags observerFlags = kCFRunLoopEntry | kCFRunLoopExit | kCFRunLoopBeforeWaiting;
    CFRunLoopObserverRef observer =
        CFRunLoopObserverCreateWithHandler(NULL, observerFlags, true, 0, observerBlock);
    CFRunLoopAddObserver(CFRunLoopGetMain(), observer, mode);

    // This runloop will exit on the second pass after all the sources and ports have had a fair
    // chance of service.
    //
    // NOTE: Some runloop observers like the gesture recognizers are called
    // in kCFRunLoopBeforeWaiting state, in order to trigger the callback we have to drain for an
    // amount > 0. See http://www.opensource.apple.com/source/CF/CF-1151.16/CFRunLoop.c
    //
    // TODO: If any source triggers a call into executeSync: when it is signalled, this could go
    // into an infinite recursion. Add some safeguard for that.
    CFRunLoopRunInMode(mode, DBL_MAX, false);
    CFRunLoopRemoveObserver(CFRunLoopGetMain(), observer, mode);
    CFRelease(observer);
    CFRunLoopRemoveSource(CFRunLoopGetMain(), source, mode);
    CFRelease(source);
    CFRelease(mode);
  }
}

void grey_performSource0(void *info);
void grey_performSource0(void *info) {
  // No-op source 0 that is triggered by runloop drain.
}

@end
