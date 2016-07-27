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

#import "Synchronization/GREYAppStateTracker.h"

#include <objc/runtime.h>
#include <pthread.h>

#import "Additions/NSObject+GREYAdditions.h"
#import "Common/GREYConfiguration.h"
#import "Common/GREYDefines.h"

/**
 *  Lock protecting element state map.
 */
static pthread_mutex_t gStateLock = PTHREAD_RECURSIVE_MUTEX_INITIALIZER;

@implementation GREYAppStateTracker {
  /**
   *  Mapping of each UI element ID to the state(s) it is in.
   *  Access should be guarded by @c gStateLock lock.
   */
  NSMapTable *_elementIDToState;
  /**
   *  Mapping of each UI element ID to the callstack of the most recently set busy state.
   *  Access should be guarded by @c gStateLock lock.
   */
  NSMapTable *_elementIDToCallStack;
  /**
   * Set of all tracked element IDs. Used for efficient membership checking and to work around
   * NSMapTable's lack of a guarantee to immediately purge weak keys.
   * Access should be guarded by @c gStateLock lock.
   */
  NSHashTable *_elementIDs;
}

+ (instancetype)sharedInstance {
  static GREYAppStateTracker *instance = nil;
  static dispatch_once_t token = 0;
  dispatch_once(&token, ^{
    instance = [[GREYAppStateTracker alloc] initOnce];
  });
  return instance;
}

/**
 *  Initializes the state tracker. Not thread-safe. Must be invoked under a race-free synchronized
 *  environment by the caller.
 *
 *  @return The initialized instance.
 */
- (instancetype)initOnce {
  self = [super init];
  if (self) {
    _elementIDToState = [NSMapTable weakToStrongObjectsMapTable];
    _elementIDToCallStack = [NSMapTable weakToStrongObjectsMapTable];
    _elementIDs = [NSHashTable weakObjectsHashTable];
  }
  return self;
}

- (NSString *)trackState:(GREYAppState)state forElement:(id)element {
  return [self grey_changeState:state forElement:element orExternalElementID:nil toBusy:YES];
}

- (void)untrackState:(GREYAppState)state forElementWithID:(NSString *)elementID {
  [self grey_changeState:state forElement:nil orExternalElementID:elementID toBusy:NO];
}

- (GREYAppState)currentState {
  return [[self grey_performBlockInCriticalSection:^id {
    // Recalc current UI state.
    GREYAppState curState = kGREYIdle;
    // Make sure that we immediately release any autoreleased internal keys.
    @autoreleasepool {
      // Iterate over the _elementID hashtable's objects because the hashtable guarantees to
      // purge weak objects, and each object in _elementIDs is a valid key in _elementIDToState.
      for (NSString *internalElementID in _elementIDs) {
        curState |= [[_elementIDToState objectForKey:internalElementID] unsignedIntegerValue];
      }
    }
    return @(curState);
  }] unsignedIntegerValue];
}

- (BOOL)isIdle {
  return [[self grey_performBlockInCriticalSection:^id{
    BOOL idle;
    // Make sure that we immediately release any autoreleased internal keys.
    @autoreleasepool {
      // If we are tracking any elements, then the app is not idle.
      idle = ([_elementIDs anyObject] == nil);
    }
    return @(idle);
  }] boolValue];
}

/**
 *  @return A string description of current pending UI event state.
 */
- (NSString *)description {
  NSMutableString *description = [[NSMutableString alloc] init];

  [self grey_performBlockInCriticalSection:^id {
    GREYAppState state = [self currentState];
    [description appendString:[self grey_stringFromState:state]];

    if (state != kGREYIdle) {
      [description appendString:@"\n\n"];
      [description appendString:@"Full state transition call stack for all elements:\n"];
      for (NSString *internalElementID in _elementIDs) {
        NSNumber *stateNumber = (NSNumber *)[_elementIDToState objectForKey:internalElementID];
        [description appendFormat:@"<%@> => %@\n",
            internalElementID,
            [self grey_stringFromState:[stateNumber unsignedIntegerValue]]];
        [description appendFormat:@"%@\n", [_elementIDToCallStack objectForKey:internalElementID]];
      }
    }
    return nil;
  }];
  return description;
}

#pragma mark - Private

- (NSString *)grey_stringFromState:(GREYAppState)state {
  NSMutableArray *eventStateString = [[NSMutableArray alloc] init];
  if (state == kGREYIdle) {
    return @"Idle";
  }

  if (state & kGREYPendingDrawLayoutPass) {
    [eventStateString addObject:@"Waiting for UIView's draw/layout pass to complete. A draw/layout "
                                @"pass normally completes in the next runloop drain."];
  }
  if (state & kGREYPendingViewsToAppear) {
    [eventStateString addObject:@"Waiting for viewDidAppear: call on this view controller. Please "
                                @"ensure that this view controller and its subclasses call "
                                @"through to their super's implementation"];
  }
  if (state & kGREYPendingViewsToDisappear) {
    [eventStateString addObject:@"Waiting for viewDidDisappear: call on this view controller. "
                                @"Please ensure that this view controller and it's subclasses call "
                                @"through to their super's implementation"];
  }
  if (state & kGREYPendingKeyboardTransition) {
    [eventStateString addObject:@"Waiting for keyboard transition to finish."];
  }
  if (state & kGREYPendingCAAnimation) {
    [eventStateString addObject:@"Waiting for CAAnimations to finish. Continuous animations may "
                                @"never finish and must be stop explicitly. Animations attached to "
                                @"hidden view may still be executing in the background."];
  }
  if (state & kGREYPendingRootViewControllerToAppear) {
    [eventStateString addObject:@"Waiting for window's rootViewController to appear. "
                                @"This should happen in the next runloop drain after a window's "
                                @"state is changed to visible."];
  }
  if (state & kGREYPendingUIWebViewAsyncRequest) {
    [eventStateString addObject:@"Waiting for UIWebView to finish loading asynchronous request."];
  }
  if (state & kGREYPendingNetworkRequest) {
    NSString *stateMsg =
        [NSString stringWithFormat:@"Waiting for network requests to finish. By default, EarlGrey "
                                   @"tracks all network requests. To tell EarlGrey of unwanted or "
                                   @"on-going network activity that should be ignored, use "
                                   @"%@.", [GREYConfiguration class]];
    [eventStateString addObject:stateMsg];
  }
  if (state & kGREYPendingGestureRecognition) {
    [eventStateString addObject:@"Waiting for system-wide gesture recognizer to detect or fail a "
                                @"recently performed gesture."];
  }
  if (state & kGREYPendingUIScrollViewScrolling) {
    [eventStateString addObject:@"Waiting for UIScrollView to finish scrolling and come to "
                                @"standstill."];
  }
  if (state & kGREYPendingUIAnimation) {
    [eventStateString addObject:@"Waiting for UIAnimation to complete. This internal animation "
                                @"is triggered by UIKit and completes when -[UIAnimation markStop] "
                                @"is invoked."];
  }
  if (state & kGREYIgnoringSystemWideUserInteraction) {
    NSString *stateMsg =
        [NSString stringWithFormat:@"System wide interaction events are being ignored via %@. "
                                   @"call %@ to enable interactions again.",
                                   NSStringFromSelector(@selector(beginIgnoringInteractionEvents)),
                                   NSStringFromSelector(@selector(endIgnoringInteractionEvents))];

    [eventStateString addObject:stateMsg];
  }

  NSAssert([eventStateString count] > 0, @"Did we forget to describe some states?");
  return [eventStateString componentsJoinedByString:@"\n"];
}

- (id)grey_performBlockInCriticalSection:(id (^)())block {
  int lock = pthread_mutex_lock(&gStateLock);
  NSAssert(lock == 0, @"Failed to lock.");
  id retVal = block();
  int unlock = pthread_mutex_unlock(&gStateLock);
  NSAssert(unlock == 0, @"Failed to unlock.");

  return retVal;
}

- (NSString *)grey_elementIDForElement:(id)element {
  return [NSString stringWithFormat:@"%@:%p", NSStringFromClass([element class]), element];
}

- (NSString *)grey_changeState:(GREYAppState)state
                  forElement:(id)element
         orExternalElementID:(NSString *)externalElementID
                      toBusy:(BOOL)busy {
  // It is possible for both element and externalElementID to be nil in cases where
  // the tracking logic tries to be overly safe and untrack elements which were never registered
  // before.
  if (!element && !externalElementID) {
    return nil;
  }

  NSAssert((element && !externalElementID || !element && externalElementID),
           @"Provide either a valid element or a valid externalElementID, not both.");
  return [self grey_performBlockInCriticalSection:^id {
    static void const *const stateAssociationKey = &stateAssociationKey;
    NSString *elementIDToReturn;

    // This autorelease pool makes sure we release any autoreleased objects added to the tracker
    // map. If we rely on external autorelease pools to be drained, we might delay removal of
    // released keys. In some cases, it could lead to a livelock (calling drainUntilIdle inside
    // drainUntilIdle where the first drainUntilIdle sets up an autorelease pool and the second
    // drainUntilIdle never returns because it is expecting the first drainUntilIdle's autorelease
    // pool to release the object so state tracker can return to idle state)
    @autoreleasepool {
      // We do not use the element we want to track as a key to its state. Instead, we key our map
      // with its element ID, a string representations of the element. We strongly associate the
      // element ID with the element and only hold weak references ourself. Since the element ID is
      // only strongly referenced by the element we are tracking, it will be deallocated when the
      // element we are tracking is deallocated. We leverage this and NSHashTable’s and
      // NSMapTable’s behavior to purge deallocated keys so that we do not track deallocated
      // elements.
      //
      // We use element IDs as weak keys instead of the elements themselves for two reasons:
      // 1) Some objects, ie objects that are being deallocated, cannot be weakly referenced.
      //    Elements may try to track and untrack themselves during dealloc.
      // 2) We can untrack objects with an element ID instead of a reference to the object. This is
      //    useful for objects that dispatch asynchronous untrack calls during their dealloc. These
      //    objects cannot safely weakify/strongify themselves during their own dealloc.
      //
      // To ensure that our weakly held element ID keys are only ever strongly referenced by the
      // elements we are tracking, the element ID that we return for untracking is a copy of our
      // internal element ID. The external element ID has the same value and can be used by us to
      // retrieve our internal key, but since the external key is different object, additional
      // references to it are harmless.

      NSString *potentialInternalElementID = externalElementID;
      if (!potentialInternalElementID) {
        potentialInternalElementID = [self grey_elementIDForElement:element];
      }

      // Get the internal element ID we store.
      NSString *internalElementID = [_elementIDs member:potentialInternalElementID];

      if (!internalElementID) {
        if (element) {
          // Explicit ownership.
          internalElementID = [[NSString alloc] initWithString:potentialInternalElementID];
          // When element deallocates, so will internalElementID causing our weak references to it
          // to be removed.
          objc_setAssociatedObject(element,
                                   stateAssociationKey,
                                   internalElementID,
                                   OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        } else {
          // External element id was specified and we couldn't find an internal element id
          // associated to the external element id. This could happen if element was deallocated and
          // we removed weak references to internal element id.
          return nil;
        }
      }

      // Always return a copy of internalElementID.
      elementIDToReturn = [NSString stringWithFormat:@"%@", internalElementID];
      NSNumber *originalStateNumber = [_elementIDToState objectForKey:internalElementID];
      GREYAppState originalState =
          originalStateNumber ? [originalStateNumber unsignedIntegerValue] : kGREYIdle;
      GREYAppState newState = busy ? (originalState | state) : (originalState & ~state);

      if (newState == kGREYIdle) {
        [_elementIDs removeObject:internalElementID];
        [_elementIDToState removeObjectForKey:internalElementID];
        [_elementIDToCallStack removeObjectForKey:internalElementID];
        if (element) {
          objc_setAssociatedObject(element, stateAssociationKey, nil, OBJC_ASSOCIATION_ASSIGN);
        }
      } else {
        // Track the element with internalElementID. When internalElementID's underlying element
        // deallocates, we expect internalElementID to deallocate as well, causing it to be removed
        // from _elementIDs, _elementIDToState, and _elementIDToCallStack because it is a weakly
        // held key.
        [_elementIDs addObject:internalElementID];
        [_elementIDToState setObject:@(newState) forKey:internalElementID];
        // TODO: Consider tracking callStackSymbols for all states, not just the last one.
        [_elementIDToCallStack setObject:[NSThread callStackSymbols] forKey:internalElementID];
      }
    }
    return elementIDToReturn;
  }];
}

- (void)grey_clearState {
  [self grey_performBlockInCriticalSection:^id {
    [_elementIDs removeAllObjects];
    [_elementIDToState removeAllObjects];
    [_elementIDToCallStack removeAllObjects];
    return nil;
  }];
}

#pragma mark - Methods Only For Testing

- (GREYAppState)grey_lastKnownStateForElement:(id)element {
  return [[self grey_performBlockInCriticalSection:^id {
    NSString *internalElementID = [self grey_elementIDForElement:element];
    NSNumber *stateNumber = [_elementIDToState objectForKey:internalElementID];
    GREYAppState state = stateNumber ? [stateNumber unsignedIntegerValue] : kGREYIdle;

    return @(state);
  }] unsignedIntegerValue];
}

@end
