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

#import "Additions/UIApplication+GREYAdditions.h"

#include <objc/runtime.h>

#import "Common/GREYExposed.h"
#import "Common/GREYSwizzler.h"
#import "Synchronization/GREYAppStateTracker.h"

static void const *const kStateTrackerElementIDKey = &kStateTrackerElementIDKey;

/**
 *  List for all the runloop modes that have been pushed and unpopped using UIApplication's push/pop
 *  runloop mode methods. The most recently pushed runloop mode is at the end of the list.
 */
static NSMutableArray *gRunLoopModes;

@implementation UIApplication (GREYAdditions)

+ (void)load {
  @autoreleasepool {
    gRunLoopModes = [[NSMutableArray alloc] init];

    GREYSwizzler *swizzler = [[GREYSwizzler alloc] init];
    SEL originalSel = @selector(beginIgnoringInteractionEvents);
    SEL swizzledSel = @selector(greyswizzled_beginIgnoringInteractionEvents);
    BOOL swizzleSuccess = [swizzler swizzleClass:self
                           replaceInstanceMethod:originalSel
                                      withMethod:swizzledSel];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIApplication beginIgnoringInteractionEvents");
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(endIgnoringInteractionEvents)
                                 withMethod:@selector(greyswizzled_endIgnoringInteractionEvents)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIApplication endIgnoringInteractionEvents");
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(pushRunLoopMode:)
                                 withMethod:@selector(greyswizzled_pushRunLoopMode:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIApplication pushRunLoopMode:");
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(pushRunLoopMode:requester:)
                                 withMethod:@selector(greyswizzled_pushRunLoopMode:requester:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIApplication pushRunLoopMode:requester:");
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(popRunLoopMode:)
                                 withMethod:@selector(greyswizzled_popRunLoopMode:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIApplication popRunLoopMode:");
    swizzleSuccess = [swizzler swizzleClass:self
                      replaceInstanceMethod:@selector(popRunLoopMode:requester:)
                                 withMethod:@selector(greyswizzled_popRunLoopMode:requester:)];
    NSAssert(swizzleSuccess, @"Cannot swizzle UIApplication popRunLoopMode:requester:");
  }
}

- (NSString *)grey_activeRunLoopMode {
  @synchronized(gRunLoopModes) {
    // could be nil.
    return [gRunLoopModes lastObject];
  }
}

# pragma mark - Swizzled Implementation

- (void)greyswizzled_beginIgnoringInteractionEvents {
  INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_beginIgnoringInteractionEvents));
  NSString *elementID = TRACK_STATE_FOR_ELEMENT(kGREYIgnoringSystemWideUserInteraction, self);
  objc_setAssociatedObject(self,
                           kStateTrackerElementIDKey,
                           elementID,
                           OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)greyswizzled_endIgnoringInteractionEvents {
  INVOKE_ORIGINAL_IMP(void, @selector(greyswizzled_endIgnoringInteractionEvents));
  // begin/end can be nested, instead of keeping the count, simply use isIgnoringInteractionEvents.
  if (!self.isIgnoringInteractionEvents) {
    NSString *elementID = objc_getAssociatedObject(self, kStateTrackerElementIDKey);
    UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYIgnoringSystemWideUserInteraction, elementID);
  }
}

- (void)greyswizzled_pushRunLoopMode:(NSString *)mode {
  [self grey_pushRunLoopMode:mode];
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_pushRunLoopMode:), mode);
}

- (void)greyswizzled_pushRunLoopMode:(NSString *)mode requester:(id)requester {
  [self grey_pushRunLoopMode:mode];
  INVOKE_ORIGINAL_IMP2(void, @selector(greyswizzled_pushRunLoopMode:requester:), mode, requester);
}

- (void)greyswizzled_popRunLoopMode:(NSString *)mode {
  [self grey_popRunLoopMode:mode];
  INVOKE_ORIGINAL_IMP1(void, @selector(greyswizzled_popRunLoopMode:), mode);
}

- (void)greyswizzled_popRunLoopMode:(NSString *)mode requester:(id)requester {
  [self grey_popRunLoopMode:mode];
  INVOKE_ORIGINAL_IMP2(void, @selector(greyswizzled_popRunLoopMode:requester:), mode, requester);
}

#pragma mark - Private Methods

- (void)grey_pushRunLoopMode:(NSString *)mode {
  @synchronized(gRunLoopModes) {
    [gRunLoopModes addObject:mode];
  }
}

- (void)grey_popRunLoopMode:(NSString *)mode {
  @synchronized(gRunLoopModes) {
    NSString *topOfStackMode = [gRunLoopModes lastObject];
    if (![topOfStackMode isEqual:mode]) {
      NSLog(@"Mode being popped: %@ isn't top of stack: %@", mode, topOfStackMode);
      abort();
    }
    [gRunLoopModes removeLastObject];
  }
}

@end
