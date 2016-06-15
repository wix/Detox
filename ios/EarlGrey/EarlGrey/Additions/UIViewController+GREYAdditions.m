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

#import "Additions/UIViewController+GREYAdditions.h"

#include <objc/runtime.h>

#import "Common/GREYExposed.h"
#import "Common/GREYSwizzler.h"
#import "Synchronization/GREYAppStateTracker.h"

/**
 *  Object association key to indicate view controller moving to @c nil window.
 */
static void const *const kMovingToNilWindowKey = &kMovingToNilWindowKey;

/**
 *  Object association key to store element id for tracking view controller state with
 *  GREYAppStateTracker.
 */
static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

/**
 *  Object association key to store appearance of view controller.
 */
static void const *const kViewControllerAppearanceKey = &kViewControllerAppearanceKey;

@implementation UIViewController (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    // Swizzle viewWillAppear.
    BOOL swizzleSuccess = [swizzler swizzleClass:self
                           replaceInstanceMethod:@selector(viewWillAppear:)
                                      withMethod:@selector(greyswizzled_viewWillAppear:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIViewController viewWillAppear");
    // Swizzle viewDidAppear.
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(viewDidAppear:)
                                 withMethod:@selector(greyswizzled_viewDidAppear:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIViewController viewDidAppear");
    // Swizzle viewWillDisappear.
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(viewWillDisappear:)
                                 withMethod:@selector(greyswizzled_viewWillDisappear:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIViewController viewWillDisappear");
    // Swizzle viewDidDisappear.
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(viewDidDisappear:)
                                 withMethod:@selector(greyswizzled_viewDidDisappear:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIViewController viewDidDisappear");
    // Swizzle viewWillMoveToWindow.
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(viewWillMoveToWindow:)
                                 withMethod:@selector(greyswizzled_viewWillMoveToWindow:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIViewController viewWillMoveToWindow:");
    // Swizzle viewDidMoveToWindow:shouldAppearOrDisappear.
    SEL swizzledSel = @selector(greyswizzled_viewDidMoveToWindow:shouldAppearOrDisappear:);
    swizzleSuccess =
        [swizzler swizzleClass:self
         replaceInstanceMethod:@selector(viewDidMoveToWindow:shouldAppearOrDisappear:)
                    withMethod:swizzledSel];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle UIViewController viewDidMoveToWindow:shouldAppearOrDisappear:");
  }
}

- (void)grey_trackAsRootViewControllerForWindow:(UIWindow *)window {
  // Untrack state for hidden (or nil) windows. When window becomes visible, this method will be
  // called again.
  if (!window || window.hidden) {
    NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
    GREYAppState state = kGREYPendingViewsToAppear | kGREYPendingRootViewControllerToAppear;
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(state, elementID);
  } else if (![self grey_hasAppeared]) {
    NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingRootViewControllerToAppear, self);
    objc_setAssociatedObject(self,
                             kStateTrackerElementIDKey,
                             elementID,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
}

#pragma mark - Swizzled Implementation

- (void)greyswizzled_viewWillMoveToWindow:(id)window {
  objc_setAssociatedObject(self,
                           kMovingToNilWindowKey,
                           (window == nil) ? @(YES) : @(NO),
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_viewWillMoveToWindow:), window);
}

- (void)greyswizzled_viewDidMoveToWindow:(id)window
                 shouldAppearOrDisappear:(BOOL)appearOrDisappear {
  // Untrack the UIViewController when it moves to a nil window. We must clear the state regardless
  // of |arg|, because viewDidAppear, viewWillDisappear or viewDidDisappear will not be called.
  if (!window) {
    NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
    GREYAppState state = (kGREYPendingViewsToAppear |
                          kGREYPendingRootViewControllerToAppear |
                          kGREYPendingViewsToDisappear);
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(state, elementID);
  }
  INVOKE_ORIGINAL_IMP2(void,
                       @selector(greyswizzled_viewDidMoveToWindow:shouldAppearOrDisappear:),
                       window,
                       appearOrDisappear);
}

- (void)greyswizzled_viewWillAppear:(BOOL)animated {
  BOOL movingToNilWindow = [self grey_isMovingToNilWindow];
  if (movingToNilWindow) {
    NSLog(@"View is moving to nil window. Skipping viewWillAppear state tracking.");
  }

  if (!movingToNilWindow) {
    // Interactive transitions can cancel and cause imbalance of will and did calls.
    id<UIViewControllerTransitionCoordinator> coordinator = [self transitionCoordinator];
    if (coordinator && [coordinator initiallyInteractive]) {
      [coordinator notifyWhenInteractionEndsUsingBlock:
          ^(id<UIViewControllerTransitionCoordinatorContext> context) {
            if ([context isCancelled]) {
              NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
              UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingViewsToAppear, elementID);
            }
          }];
    }

    NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingViewsToAppear, self);
    objc_setAssociatedObject(self,
                             kStateTrackerElementIDKey,
                             elementID,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_viewWillAppear:), animated);
}

- (void)greyswizzled_viewDidAppear:(BOOL)animated {
  NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
  GREYAppState state = kGREYPendingViewsToAppear | kGREYPendingRootViewControllerToAppear;
  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(state, elementID);

  [self grey_setAppeared:YES];
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_viewDidAppear:), animated);
}

- (void)greyswizzled_viewWillDisappear:(BOOL)animated {
  BOOL movingToNilWindow = [self grey_isMovingToNilWindow];
  if (movingToNilWindow) {
    NSLog(@"View is moving to nil window. Skipping viewWillDisappear state tracking.");
  }

  if (!movingToNilWindow) {
    // Interactive transitions can cancel and cause imbalance of will and did calls.
    id<UIViewControllerTransitionCoordinator> coordinator = [self transitionCoordinator];
    if (coordinator && [coordinator initiallyInteractive]) {
      [coordinator notifyWhenInteractionEndsUsingBlock:
          ^(id<UIViewControllerTransitionCoordinatorContext> context) {
            if ([context isCancelled]) {
              NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
              UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingViewsToDisappear, elementID);
            }
          }];
    }

    NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingViewsToDisappear, self);
    objc_setAssociatedObject(self,
                             kStateTrackerElementIDKey,
                             elementID,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_viewWillDisappear:), animated);
}

- (void)greyswizzled_viewDidDisappear:(BOOL)animated {
  NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
  GREYAppState state = (kGREYPendingViewsToAppear |
                        kGREYPendingRootViewControllerToAppear |
                        kGREYPendingViewsToDisappear);
  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(state, elementID);

  [self grey_setAppeared:NO];
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_viewDidDisappear:), animated);
}

#pragma mark - Private

/**
 *  @return @c YES if the view backed by this view controller has UIViewController::viewDidAppear:
 *          callback called and no other disappearance methods have been invoked.
 */
- (BOOL)grey_hasAppeared {
  return [objc_getAssociatedObject(self, kViewControllerAppearanceKey) boolValue];
}

/**
 *  Sets the appearance state of the view backed by this view controller to value of @c appeared.
 *  Use UIViewController::grey_hasAppeared to query this value.
 *
 *  @param appeared A @c BOOL indicating if the view backed by this view controller has appeared.
 */
- (void)grey_setAppeared:(BOOL)appeared {
  objc_setAssociatedObject(self,
                           kViewControllerAppearanceKey,
                           @(appeared),
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

/**
 *  @return @c YES if self or any ancestor of the view controller is moving to a @c nil window.
 */
- (BOOL)grey_isMovingToNilWindow {
  UIViewController *parent = self;
  while (parent) {
    if ([objc_getAssociatedObject(parent, kMovingToNilWindowKey) boolValue]) {
      return YES;
    }
    parent = [parent parentViewController];
  }
  return NO;
}

@end
