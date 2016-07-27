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

#import "Additions/UIView+GREYAdditions.h"

#include <objc/runtime.h>

#import "Additions/NSObject+GREYAdditions.h"
#import "Common/GREYConstants.h"
#import "Common/GREYSwizzler.h"
#import "Provider/GREYElementProvider.h"
#import "Synchronization/GREYAppStateTracker.h"
#import "Synchronization/GREYTimedIdlingResource.h"

/**
 * Object-association key used for keeping track of the subview that should be always on top.
 */
static void const *const kAlwaysTopMostSubviewKey = &kAlwaysTopMostSubviewKey;

/**
 * Object-association key used for storing the view's frame so it can be reset when the parent
 * changes it.
 */
static void const *const kFixedFrame = &kFixedFrame;

/**
 * Object-association key used for keeping track of the view's state.
 */
static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

/**
 * Object-association key used for storing the view's alpha value when invoking
 * UIView::grey_setAlphaAndStoreCurrentValue.
 */
static void const *const kOriginalAlphaKey = &kOriginalAlphaKey;

@implementation UIView (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];

    BOOL swizzleSuccess = [swizzler swizzleClass:self
                           replaceInstanceMethod:@selector(setNeedsDisplay)
                                      withMethod:@selector(greyswizzled_setNeedsDisplay)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView setNeedsDisplay");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(setFrame:)
                                 withMethod:@selector(greyswizzled_setFrame:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView setFrame");

    // TODO: We are making the assumption that no parent view will adjust the bounds of
    // its subview. If this assumption fails, we would need to swizzle setBounds as well and make
    // sure it is not changed if subview is expected to be on top and fixed at a specific position.
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(setCenter:)
                                 withMethod:@selector(greyswizzled_setCenter:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView setCenter");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(addSubview:)
                                 withMethod:@selector(greyswizzled_addSubview:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView addSubview");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(willRemoveSubview:)
                                 withMethod:@selector(greyswizzled_willRemoveSubview:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView willRemoveSubview");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(insertSubview:atIndex:)
                                 withMethod:@selector(greyswizzled_insertSubview:atIndex:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView insertSubview:atIndex:");

    SEL originalSel = @selector(exchangeSubviewAtIndex:withSubviewAtIndex:);
    SEL swizzledSel = @selector(greyswizzled_exchangeSubviewAtIndex:withSubviewAtIndex:);
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView exchangeSubviewAtIndex:withSubviewAtIndex:");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(insertSubview:aboveSubview:)
                                 withMethod:@selector(greyswizzled_insertSubview:aboveSubview:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView insertSubview:aboveSubview:");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(insertSubview:belowSubview:)
                                 withMethod:@selector(greyswizzled_insertSubview:belowSubview:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView insertSubview:belowSubview:");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(setNeedsDisplayInRect:)
                                 withMethod:@selector(greyswizzled_setNeedsDisplayInRect:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView setNeedsDisplayInRect");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(setNeedsLayout)
                                 withMethod:@selector(greyswizzled_setNeedsLayout)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView setNeedsLayout");

    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(setNeedsUpdateConstraints)
                                 withMethod:@selector(greyswizzled_setNeedsUpdateConstraints)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView setNeedsUpdateConstraints");

    // Swizzle for tracking block based animations.
    swizzleSuccess =
    [swizzler swizzleClass:self
        replaceClassMethod:@selector(animateWithDuration:animations:)
                withMethod:@selector(greyswizzled_animateWithDuration:animations:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView animateWithDuration:animations:");

    originalSel = @selector(animateWithDuration:animations:completion:);
    swizzledSel = @selector(greyswizzled_animateWithDuration:animations:completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView animateWithDuration:animations:completion:");

    originalSel = @selector(animateWithDuration:delay:options:animations:completion:);
    swizzledSel = @selector(greyswizzled_animateWithDuration:delay:options:animations:completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle UIView animateWithDuration:delay:options:animations:completion:");

    originalSel = @selector(animateWithDuration:delay:usingSpringWithDamping:initialSpringVelocity:
                            options:animations:completion:);
    swizzledSel = @selector(greyswizzled_animateWithDuration:delay:usingSpringWithDamping:
                            initialSpringVelocity:options:animations:completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle UIView animateWithDuration:delay:usingSpringWithDamping:"
             @"initialSpringVelocity:options:animations:completion:");

    originalSel = @selector(transitionWithView:duration:options:animations:completion:);
    swizzledSel =
        @selector(greyswizzled_transitionWithView:duration:options:animations:completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle UIView transitionWithView:duration:options:animations:completion:");

    originalSel = @selector(transitionFromView:toView:duration:options:completion:);
    swizzledSel = @selector(greyswizzled_transitionFromView:toView:duration:options:completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle UIView transitionFromView:toView:duration:options:completion:");

    originalSel = @selector(animateKeyframesWithDuration:delay:options:animations:completion:);
    swizzledSel = @selector(greyswizzled_animateKeyframesWithDuration:delay:options:animations:
                            completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess,
             @"Cannot swizzle UIView "
             @"animateKeyframesWithDuration:delay:options:animations:completion:");

    originalSel = @selector(performSystemAnimation:onViews:options:animations:completion:);
    swizzledSel =
        @selector(greyswizzled_performSystemAnimation:onViews:options:animations:completion:);
    swizzleSuccess = [swizzler swizzleClass:self
                         replaceClassMethod:originalSel
                                 withMethod:swizzledSel];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIView performSystemAnimation:onViews:"
                             @"options:animations:completion:");
  }
}

- (NSArray *)grey_childElementsAssignableFromClass:(Class)klass {
  NSMutableArray *subviews = [[NSMutableArray alloc] init];
  for (UIView *child in self.subviews) {
    GREYElementProvider *childHierarchy = [GREYElementProvider providerWithRootElements:@[ child ]];
    [subviews addObjectsFromArray:[[childHierarchy dataEnumerator] allObjects]];
  }

  return [subviews filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:
      ^BOOL(id evaluatedObject, NSDictionary *bindings) {
        return [evaluatedObject isKindOfClass:klass];
  }]];
}

- (void)grey_keepSubviewOnTopAndFrameFixed:(UIView *)view {
  NSValue *frameRect = [NSValue valueWithCGRect:view.frame];
  objc_setAssociatedObject(view, kFixedFrame, frameRect, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  objc_setAssociatedObject(self,
                           kAlwaysTopMostSubviewKey,
                           view,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  [self bringSubviewToFront:view];
}

- (void)grey_bringAlwaysTopSubviewToFront {
  UIView *alwaysTopSubview = objc_getAssociatedObject(self, kAlwaysTopMostSubviewKey);
  if (alwaysTopSubview && [self.subviews containsObject:alwaysTopSubview]) {
    [self bringSubviewToFront:alwaysTopSubview];
  }
}

- (void)grey_saveCurrentAlphaAndUpdateWithValue:(float)alpha {
  objc_setAssociatedObject(self,
                           kOriginalAlphaKey,
                           @(self.alpha),
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  self.alpha = alpha;
}

- (void)grey_restoreAlpha {
  id alpha = objc_getAssociatedObject(self, kOriginalAlphaKey);
  self.alpha = [alpha floatValue];
  objc_setAssociatedObject(self, kOriginalAlphaKey, nil, OBJC_ASSOCIATION_ASSIGN);
}

- (BOOL)grey_isVisible {
  if (CGRectIsEmpty([self accessibilityFrame])) {
    return NO;
  }

  UIView *ancestorView = self;
  do {
    if (ancestorView.hidden || ancestorView.alpha < kGREYMinimumVisibleAlpha) {
      return NO;
    }
    ancestorView = ancestorView.superview;
  } while (ancestorView);

  return YES;
}

#pragma mark - Swizzled Implementation

- (void)greyswizzled_setCenter:(CGPoint)center {
  NSValue *fixedFrame = objc_getAssociatedObject(self, kFixedFrame);
  if (fixedFrame) {
    center = CGPointMake(CGRectGetMidX(fixedFrame.CGRectValue),
                         CGRectGetMidY(fixedFrame.CGRectValue));
  }
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_setCenter:), center);
}

- (void)greyswizzled_setFrame:(CGRect)frame {
  NSValue *fixedFrame = objc_getAssociatedObject(self, kFixedFrame);
  if (fixedFrame) {
    frame = fixedFrame.CGRectValue;
  }
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_setFrame:), frame);
}

- (void)greyswizzled_addSubview:(UIView *)view {
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_addSubview:), view);
  [self grey_bringAlwaysTopSubviewToFront];
}

- (void)greyswizzled_willRemoveSubview:(UIView *)view {
  UIView *alwaysTopSubview = objc_getAssociatedObject(self, kAlwaysTopMostSubviewKey);

  if ([view isEqual:alwaysTopSubview]) {
    objc_setAssociatedObject(self, kAlwaysTopMostSubviewKey, nil, OBJC_ASSOCIATION_ASSIGN);
    objc_setAssociatedObject(view, kFixedFrame, nil, OBJC_ASSOCIATION_ASSIGN);
  }
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_willRemoveSubview:), view);
}

- (void)greyswizzled_insertSubview:(UIView *)view aboveSubview:(UIView *)siblingSubview {
  INVOKE_ORIGINAL_IMP2(void,
                       @selector(greyswizzled_insertSubview:aboveSubview:),
                       view,
                       siblingSubview);
  [self grey_bringAlwaysTopSubviewToFront];
}

- (void)greyswizzled_insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview {
  INVOKE_ORIGINAL_IMP2(void,
                       @selector(greyswizzled_insertSubview:belowSubview:),
                       view,
                       siblingSubview);
  [self grey_bringAlwaysTopSubviewToFront];
}

- (void)greyswizzled_insertSubview:(UIView *)view atIndex:(NSInteger)index {
  INVOKE_ORIGINAL_IMP2(void, @selector(greyswizzled_insertSubview:atIndex:), view, index);
  [self grey_bringAlwaysTopSubviewToFront];
}

- (void)greyswizzled_exchangeSubviewAtIndex:(NSInteger)index1 withSubviewAtIndex:(NSInteger)index2 {
  INVOKE_ORIGINAL_IMP2(void,
                       @selector(greyswizzled_exchangeSubviewAtIndex:withSubviewAtIndex:),
                       index1,
                       index2);
  [self grey_bringAlwaysTopSubviewToFront];
}

- (void)greyswizzled_setNeedsDisplayInRect:(CGRect)rect {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingDrawLayoutPass, self);
  // Next runloop drain will perform the draw pass.
  dispatch_async(dispatch_get_main_queue(), ^ {
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingDrawLayoutPass, elementID);
  });
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_setNeedsDisplayInRect:), rect);
}

- (void)greyswizzled_setNeedsDisplay {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingDrawLayoutPass, self);
  // Next runloop drain will perform the draw pass.
  dispatch_async(dispatch_get_main_queue(), ^ {
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingDrawLayoutPass, elementID);
  });
  INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_setNeedsDisplay));
}

- (void)greyswizzled_setNeedsLayout {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingDrawLayoutPass, self);
  // Next runloop drain will perform the draw pass.
  dispatch_async(dispatch_get_main_queue(), ^ {
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingDrawLayoutPass, elementID);
  });
  INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_setNeedsLayout));
}

- (void)greyswizzled_setNeedsUpdateConstraints {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingDrawLayoutPass, self);
  // Next runloop drain will perform the draw pass.
  dispatch_async(dispatch_get_main_queue(), ^ {
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingDrawLayoutPass, elementID);
  });
  INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_setNeedsUpdateConstraints));
}

#pragma mark - Swizzled Block based Animation

+ (void)greyswizzled_animateWithDuration:(NSTimeInterval)duration
                              animations:(void (^)(void))animations {
  INVOKE_ORIGINAL_IMP2(void,
                       @selector(greyswizzled_animateWithDuration:animations:),
                       duration,
                       animations);
  NSObject *trackingObject = [[NSObject alloc] init];
  [GREYTimedIdlingResource resourceForObject:trackingObject
                       thatIsBusyForDuration:duration
                                        name:NSStringFromSelector(_cmd)];
}

+ (void)greyswizzled_animateWithDuration:(NSTimeInterval)duration
                              animations:(void (^)(void))animations
                              completion:(void (^)(BOOL))completion {
  INVOKE_ORIGINAL_IMP3(void,
                       @selector(greyswizzled_animateWithDuration:animations:completion:),
                       duration,
                       animations,
                       completion);
  NSObject *trackingObject = [[NSObject alloc] init];
  [GREYTimedIdlingResource resourceForObject:trackingObject
                       thatIsBusyForDuration:duration
                                        name:NSStringFromSelector(_cmd)];
}

+ (void)greyswizzled_animateWithDuration:(NSTimeInterval)duration
                                   delay:(NSTimeInterval)delay
                                 options:(UIViewAnimationOptions)options
                              animations:(void (^)(void))animations
                              completion:(void (^)(BOOL))completion {
  SEL swizzledSEL =
  @selector(greyswizzled_animateWithDuration:delay:options:animations:completion:);
  INVOKE_ORIGINAL_IMP5(void, swizzledSEL, duration, delay, options, animations, completion);

  if ((options & UIViewAnimationOptionAllowUserInteraction) == 0) {
    NSObject *trackingObject = [[NSObject alloc] init];
    [GREYTimedIdlingResource resourceForObject:trackingObject
                         thatIsBusyForDuration:(delay + duration)
                                          name:NSStringFromSelector(_cmd)];
  }
}

+ (void)greyswizzled_animateWithDuration:(NSTimeInterval)duration
                                   delay:(NSTimeInterval)delay
                  usingSpringWithDamping:(CGFloat)dampingRatio
                   initialSpringVelocity:(CGFloat)velocity
                                 options:(UIViewAnimationOptions)options
                              animations:(void (^)(void))animations
                              completion:(void (^)(BOOL))completion {
  SEL swizzledSEL = @selector(greyswizzled_animateWithDuration:delay:usingSpringWithDamping:
                              initialSpringVelocity:options:animations:completion:);
  INVOKE_ORIGINAL_IMP7(void,
                       swizzledSEL,
                       duration,
                       delay,
                       dampingRatio,
                       velocity,
                       options,
                       animations,
                       completion);
  if ((options & UIViewAnimationOptionAllowUserInteraction) == 0) {
    NSObject *trackingObject = [[NSObject alloc] init];
    [GREYTimedIdlingResource resourceForObject:trackingObject
                         thatIsBusyForDuration:(delay + duration)
                                          name:NSStringFromSelector(_cmd)];
  }
}

+ (void)greyswizzled_animateKeyframesWithDuration:(NSTimeInterval)duration
                                            delay:(NSTimeInterval)delay
                                          options:(UIViewKeyframeAnimationOptions)options
                                       animations:(void (^)(void))animations
                                       completion:(void (^)(BOOL))completion {
  SEL swizzledSEL =
  @selector(greyswizzled_animateKeyframesWithDuration:delay:options:animations:completion:);
  INVOKE_ORIGINAL_IMP5(void, swizzledSEL, duration, delay, options, animations, completion);

  if ((options & UIViewKeyframeAnimationOptionAllowUserInteraction) == 0) {
    NSObject *trackingObject = [[NSObject alloc] init];
    [GREYTimedIdlingResource resourceForObject:trackingObject
                         thatIsBusyForDuration:(delay + duration)
                                          name:NSStringFromSelector(_cmd)];
  }
}

+ (void)greyswizzled_transitionFromView:(UIView *)fromView
                                 toView:(UIView *)toView
                               duration:(NSTimeInterval)duration
                                options:(UIViewAnimationOptions)options
                             completion:(void (^)(BOOL))completion {
  SEL swizzledSEL =
      @selector(greyswizzled_transitionFromView:toView:duration:options:completion:);
  INVOKE_ORIGINAL_IMP5(void, swizzledSEL, fromView, toView, duration, options, completion);

  if ((options & UIViewAnimationOptionAllowUserInteraction) == 0) {
    NSObject *trackingObject = [[NSObject alloc] init];
    [GREYTimedIdlingResource resourceForObject:trackingObject
                         thatIsBusyForDuration:duration
                                          name:NSStringFromSelector(_cmd)];
  }
}

+ (void)greyswizzled_transitionWithView:(UIView *)view
                               duration:(NSTimeInterval)duration
                                options:(UIViewAnimationOptions)options
                             animations:(void (^)(void))animations
                             completion:(void (^)(BOOL))completion {
  SEL swizzledSEL =
      @selector(greyswizzled_transitionWithView:duration:options:animations:completion:);
  INVOKE_ORIGINAL_IMP5(void, swizzledSEL, view, duration, options, animations, completion);

  if ((options & UIViewAnimationOptionAllowUserInteraction) == 0) {
    NSObject *trackingObject = [[NSObject alloc] init];
    [GREYTimedIdlingResource resourceForObject:trackingObject
                         thatIsBusyForDuration:duration
                                          name:NSStringFromSelector(_cmd)];
  }
}

+ (void)greyswizzled_performSystemAnimation:(UISystemAnimation)animation
                                    onViews:(NSArray *)views
                                    options:(UIViewAnimationOptions)options
                                 animations:(void (^)(void))parallelAnimations
                                 completion:(void (^)(BOOL))completion {
  GREYTimedIdlingResource *resource;
  if ((options & UIViewAnimationOptionAllowUserInteraction) == 0) {
    // TODO: Refactor this to use the completion block with a timeout in case it isn't invoked.
    NSObject *trackingObject = [[NSObject alloc] init];
    resource = [GREYTimedIdlingResource resourceForObject:trackingObject
                                    thatIsBusyForDuration:2.0 // assume animation finishes in 2 sec.
                                                     name:NSStringFromSelector(_cmd)];
  }
  SEL swizzledSEL =
      @selector(greyswizzled_performSystemAnimation:onViews:options:animations:completion:);
  void (^customCompletion)(BOOL) = ^(BOOL finished) {
    if (completion) {
      completion(finished);
    }
    [resource stopMonitoring];
  };
  INVOKE_ORIGINAL_IMP5(void,
                       swizzledSEL,
                       animation,
                       views,
                       options,
                       parallelAnimations,
                       customCompletion);
}

@end
