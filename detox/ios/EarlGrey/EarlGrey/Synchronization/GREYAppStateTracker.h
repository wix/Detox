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

#import <Foundation/Foundation.h>

/**
 * @file
 * @brief App state tracker header file.
 */

/**
 *  Non-idle states that the App can be at any given point in time.
 *  These states are not mutually exclusive and can be combined together using Bitwise-OR to
 *  represent multiple states.
 */
typedef NS_OPTIONS(NSUInteger, GREYAppState){
  /**
   *  Idle state implies App is not undergoing any state changes and it is OK to interact with it.
   */
  kGREYIdle = 0,
  /**
   *  View is pending draw or layout pass.
   */
  kGREYPendingDrawLayoutPass = (1UL << 0),
  /**
   *  Waiting for viewDidAppear: method invocation.
   */
  kGREYPendingViewsToAppear = (1UL << 1),
  /**
   *  Waiting for viewDidDisappear: method invocation.
   */
  kGREYPendingViewsToDisappear = (1UL << 2),
  /**
   *  Pending keyboard transition.
   */
  kGREYPendingKeyboardTransition = (1UL << 3),
  /**
   *  Waiting for CA animation to complete.
   */
  kGREYPendingCAAnimation = (1UL << 4),
  /**
   *  Waiting for a UIAnimation to be marked as stopped.
   */
  kGREYPendingUIAnimation = (1UL << 5),
  /**
   *  Pending root view controller to be set.
   */
  kGREYPendingRootViewControllerToAppear = (1UL << 6),
  /**
   *  Pending a UIWebView async load request
   */
  kGREYPendingUIWebViewAsyncRequest = (1UL << 7),
  /**
   *  Pending a network request completion.
   */
  kGREYPendingNetworkRequest = (1UL << 8),
  /**
   *  Pending gesture recognition.
   */
  kGREYPendingGestureRecognition = (1UL << 9),
  /**
   *  Waiting for UIScrollView to finish scrolling.
   */
  kGREYPendingUIScrollViewScrolling = (1UL << 10),
  /**
   *  [UIApplication beginIgnoringInteractionEvents] was called and all interaction events are
   *  being ignored.
   */
  kGREYIgnoringSystemWideUserInteraction = (1UL << 11),
};

/**
 *  Class that tracks the application state so that EarlGrey can wait until the application is idle
 *  before performing actions or assertions.
 */
@interface GREYAppStateTracker : NSObject

/**
 *  @return The unique shared instance of the GREYAppStateTracker.
 */
+ (instancetype)sharedInstance;

/**
 *  @remark init is not an available initializer. Use the other initializers.
 */
- (instancetype)init NS_UNAVAILABLE;

/**
 *  @return The state that the App is in currently.
 */
- (GREYAppState)currentState;

/**
 * Method for checking if GREYAppStateTracker::currentState is idle. More efficient than
 * currentState.
 *
 * @return @c YES if the state of the App is currently kGREYIdle, @c NO otherwise.
 */
- (BOOL)isIdle;

/**
 *  Updates the state of the element, including the provided @c state and updating the overall state
 *  of the application. If @c element is already being tracked with for a different state, the
 *  element's state will be updated to a XOR of the current state and @c state.
 *
 *  @param state   The state that should be tracked for the element.
 *  @param element The element that should have its tracked state updated.
 *
 *  @return The identifier that was assigned to the element by the state tracker, or @c nil if
 *          @c element is @c nil. Future calls for the same element will return the same identifier
 *          until the element is untracked.
 */
- (NSString *)trackState:(GREYAppState)state forElement:(id)element;

/**
 *  Untracks the state from the element with the specified id.
 *
 *  @param state     The state that should be untracked.
 *  @param elementID The identifer of the element which state should be untracked.
 */
- (void)untrackState:(GREYAppState)state forElementWithID:(NSString *)elementID;

@end

/**
 *  Utility macro for tracking the state of an element.
 *
 *  @param state   The state that should be tracked for the element.
 *  @param element The element that should have its tracked state updated.
 *
 *  @return The identifier that was assigned to the element by the state tracker, or @c nil if
 *          @c element is @c nil. Future calls for the same element will return the same identifier
 *          until the element is untracked.
 */
#define TRACK_STATE_FOR_ELEMENT(state_, element_) \
  [[GREYAppStateTracker sharedInstance] trackState:state_ forElement:element_]

/**
 *  Utility macro for untracking the state of an element.
 *
 *  @param state     The state that should be untracked.
 *  @param elementID The identifer of the element which state should be untracked.
 */
#define UNTRACK_STATE_FOR_ELEMENT_WITH_ID(state_, elementID_) \
  [[GREYAppStateTracker sharedInstance] untrackState:state_ forElementWithID:elementID_]
