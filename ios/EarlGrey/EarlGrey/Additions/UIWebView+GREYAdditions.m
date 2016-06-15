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

#import "Additions/UIWebView+GREYAdditions.h"

#import <UIKit/UIKit.h>
#include <objc/runtime.h>

#import "Common/GREYSwizzler.h"
#import "Delegate/GREYUIWebViewDelegate.h"
#import "Synchronization/GREYAppStateTracker.h"
#import "Synchronization/GREYTimedIdlingResource.h"

/**
 *  Key used to keep a list of all proxy delegates as someone could be holding a weak reference to
 *  it. This list gets cleaned up as soon as the UIWebView is deallocated.
 */
static void const *const kUIWebViewDelegateListKey = &kUIWebViewDelegateListKey;

/**
 *  Key used to store the GREYAppStateTracker element id that is needed to untrack this object.
 */
static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

/**
 *  Key for tracking timed idling resource used for pending interaction state.
 */
static void const *const kUIWebViewPendingInteractionKey = &kUIWebViewPendingInteractionKey;

/**
 *  Key for tracking the web view's loading state. Used to track the web view with respect to its
 *  delegate callbacks, which is more reliable than UIWebView's isLoading method.
 */
static void const *const kUIWebViewLoadingStateKey = &kUIWebViewLoadingStateKey;

@implementation UIWebView (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    BOOL swizzleSuccess = [swizzler swizzleClass:self
                           replaceInstanceMethod:@selector(delegate)
                                      withMethod:@selector(greyswizzled_delegate)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIWebView delegate");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(setDelegate:)
                                 withMethod:@selector(greyswizzled_setDelegate:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIWebView setDelegate:");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(stopLoading)
                                 withMethod:@selector(greyswizzled_stopLoading)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIWebView stopLoading:");
  }
}

/**
 *  Explicitly clears the pending interaction state for UIWebViews.
 */
- (void)grey_clearPendingInteraction {
  GREYTimedIdlingResource *timedIdlingResource =
      objc_getAssociatedObject(self, kUIWebViewPendingInteractionKey);
  [timedIdlingResource stopMonitoring];
}

/**
 *  Will mark the UIWebView's state as busy waiting for interaction until @c seconds have elapsed or
 *  UIWebView::grey_clearPendingInteraction is called (whichever comes first).
 *
 *  @param seconds Time interval in seconds for which to mark the UIWebView as busy.
 */
- (void)grey_pendingInteractionForTime:(NSTimeInterval)seconds {
  [self grey_clearPendingInteraction];
  NSString *resourceName =
      [NSString stringWithFormat:@"Timed idling resource for <%@:%p>", [self class], self];
  id<GREYIdlingResource> timedResource = [GREYTimedIdlingResource resourceForObject:self
                                                              thatIsBusyForDuration:seconds
                                                                               name:resourceName];
  objc_setAssociatedObject(self,
                           kUIWebViewPendingInteractionKey,
                           timedResource,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 *  Marks webview as pending load in GREYAppStateTracker.
 */
- (void)grey_trackAJAXLoading {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingUIWebViewAsyncRequest, self);
  objc_setAssociatedObject(self,
                           kStateTrackerElementIDKey,
                           elementID,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 *  Untracks webview loading state from GREYAppStateTracker.
 */
- (void)grey_untrackAJAXLoading {
  NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingUIWebViewAsyncRequest, elementID);
}

/**
 *  Sets the loading state for this webview.
 *
 *  @param loading BOOL value indicating the new loading state of this webview.
 */
- (void)grey_setIsLoadingFrame:(BOOL)loading {
  objc_setAssociatedObject(self,
                           kUIWebViewLoadingStateKey,
                           @(loading),
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 *  @return the loading state for this webview.
 */
- (BOOL)grey_isLoadingFrame {
  NSNumber *loading = objc_getAssociatedObject(self, kUIWebViewLoadingStateKey);
  return [loading boolValue];
}

#pragma mark - Swizzled Implementation

- (void)greyswizzled_stopLoading {
  [self grey_untrackAJAXLoading];
  INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_stopLoading));
}

- (void)greyswizzled_setDelegate:(id<UIWebViewDelegate>)delegate {
  id<UIWebViewDelegate> proxyDelegate = [self grey_proxyDelegateFromDelegate:delegate];
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_setDelegate:), proxyDelegate);
}

- (id<UIWebViewDelegate>)greyswizzled_delegate {
  // If a delegate was never set we still need the proxy delegate for tracking.
  // It's possible for setDelegate to be used and then delegate calls to be received w/o
  // grey_delegate being called, thus we need to check for and install the proxy delegate in both
  // grey_setDelegate and grey_delegate.
  id<UIWebViewDelegate> originalDelegate =
      INVOKE_ORIGINAL_IMP(id<UIWebViewDelegate>, @selector(greyswizzled_delegate));
  id<UIWebViewDelegate> proxyDelegate = [self grey_proxyDelegateFromDelegate:originalDelegate];
  if (originalDelegate != proxyDelegate) {
    INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_setDelegate:), proxyDelegate);
  }
  return proxyDelegate;
}

#pragma mark - Private

/**
 *  Helper method for wrapping a provided delegate in a GREYUIWebViewDelegate object.
 *
 *  @param delegate The original UIWebViewDelegate being proxied.
 *
 *  @return instance of GREYUIWebViewDelegate backed by the original delegate.
 */
- (id<UIWebViewDelegate>)grey_proxyDelegateFromDelegate:(id<UIWebViewDelegate>)delegate {
  id<UIWebViewDelegate> proxyDelegate = delegate;

  if (![proxyDelegate isKindOfClass:[GREYUIWebViewDelegate class]]) {
    proxyDelegate = [[GREYUIWebViewDelegate alloc] initWithOriginalDelegate:delegate isWeak:YES];

    // We need to keep a list of all proxy delegates as someone could be holding a weak reference to
    // it. This list will get cleaned up as soon as webview is deallocated so we might have a slight
    // memory spike until that happens.
    NSMutableArray *delegateList = objc_getAssociatedObject(self, kUIWebViewDelegateListKey);
    if (!delegateList) {
      delegateList = [[NSMutableArray alloc] init];
    }

    [delegateList addObject:proxyDelegate];
    // Store delegate using objc_setAssociatedObject because setDelegate method doesn't retain.
    objc_setAssociatedObject(self,
                             kUIWebViewDelegateListKey,
                             delegateList,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  return proxyDelegate;
}

@end
