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

#import "Additions/CAAnimation+GREYAdditions.h"

#include <objc/runtime.h>

#import "Common/GREYDefines.h"
#import "Common/GREYPrivate.h"
#import "Common/GREYSwizzler.h"
#import "Delegate/GREYCAAnimationDelegate.h"
#import "Synchronization/GREYAppStateTracker.h"

static void const *const kAnimationStateKey = &kAnimationStateKey;
static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

@implementation CAAnimation (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    // Swizzle delegate.
    BOOL swizzleSuccess = [swizzler swizzleClass:self
                           replaceInstanceMethod:@selector(delegate)
                                      withMethod:@selector(greyswizzled_delegate)];
    NSAssert(swizzleSuccess, @"Cannot swizzle CAAnimation delegate");
  }
}

- (void)grey_setAnimationState:(GREYCAAnimationState)state {
  objc_setAssociatedObject(self, kAnimationStateKey, @(state), OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  if (state == kGREYAnimationStarted) {
    [self grey_trackForDurationOfAnimation];
  } else {
    [self grey_untrack];
  }
}

- (GREYCAAnimationState)grey_animationState {
  NSNumber *animationState = objc_getAssociatedObject(self, kAnimationStateKey);
  if (!animationState) {
    return kGREYAnimationPendingStart;
  } else {
    return animationState.unsignedIntegerValue;
  }
}

- (void)grey_trackForDurationOfAnimation {
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingCAAnimation, self);
  objc_setAssociatedObject(self,
                           kStateTrackerElementIDKey,
                           elementID,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);

  CFTimeInterval animRuntimeTime =
      self.duration + self.repeatCount * self.duration + self.repeatDuration;
  // Add extra padding to the animation runtime just as a safeguard. This comes into play when
  // animatonDidStop delegate is not invoked before the expected end-time is reached.
  // The state is then automatically cleared for this animation as it should have finished by now.
  animRuntimeTime += MIN(animRuntimeTime, 1.0);
  // EarlGrey swizzles this method. Call directly to the original implementation.
  INVOKE_ORIGINAL_IMP4(void,
                       @selector(greyswizzled_performSelector:withObject:afterDelay:inModes:),
                       @selector(grey_untrack),
                       nil,
                       animRuntimeTime,
                       @[ NSRunLoopCommonModes ]);
}

- (void)grey_untrack {
  NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingCAAnimation, elementID);
  [NSObject cancelPreviousPerformRequestsWithTarget:self
                                           selector:@selector(grey_untrack)
                                             object:nil];
}

#pragma mark - Swizzled Implementation

- (id)greyswizzled_delegate {
  id delegate = INVOKE_ORIGINAL_IMP(id, @selector(greyswizzled_delegate));
  if (![delegate isKindOfClass:[GREYCAAnimationDelegate class]]) {
    delegate = [[GREYCAAnimationDelegate alloc] initWithOriginalCAAnimationDelegate:delegate];
  }
  // We don't call setDelegate: here because this might be an immutable internal class such as
  // CAAnimationImmutable.
  return delegate;
}

@end
