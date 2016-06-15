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

#import "Additions/_UIGestureRecognizerFailureMap_GREYAdditions.h"

#include <objc/runtime.h>

#import "Common/GREYSwizzler.h"
#import "Synchronization/GREYAppStateTracker.h"

@implementation _UIGestureRecognizerFailureMap_GREYAdditions

+ (void)load {
  @autoreleasepool {
    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    SEL newGestureSelector = @selector(greyswizzled_hasUnmetFailureRequirementsOrDependents);
    SEL originalGestureSelector =
        NSSelectorFromString(@"hasUnmetFailureRequirementsOrDependents");

    BOOL swizzled = [swizzler swizzleClass:NSClassFromString(@"_UIGestureRecognizerFailureMap")
                         addInstanceMethod:newGestureSelector
                        withImplementation:[self instanceMethodForSelector:newGestureSelector]
              andReplaceWithInstanceMethod:originalGestureSelector];
    NSAssert(swizzled, @"Failed to swizzle _UIGestureRecognizerFailureMap "
                       @"hasUnmetFailureRequirementsOrDependents");
  }
}

#pragma mark - Swizzled Implementation

/**
 *  Called by the system to evaluate whether there are any unmet requirements on the gesture
 *  recognizers. We track this state until there aren't any unmet requirements.
 *
 *  @return @c YES if the gesture recognizers have any unment requirements, @c NO otherwise.
 */
- (BOOL)greyswizzled_hasUnmetFailureRequirementsOrDependents {
  BOOL hasUnmet =
      INVOKE_ORIGINAL_IMP(BOOL, @selector(greyswizzled_hasUnmetFailureRequirementsOrDependents));
  static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

  if (hasUnmet) {
    NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYPendingGestureRecognition, self);
    objc_setAssociatedObject(self,
                             kStateTrackerElementIDKey,
                             elementID,
                             OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  } else {
    NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingGestureRecognition, elementID);
  }
  return hasUnmet;
}

@end
