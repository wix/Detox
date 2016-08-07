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

#import <EarlGrey/GREYAppStateTracker.h>

#import "GREYBaseTest.h"

@interface GREYAppStateTrackerTest : GREYBaseTest

@end

@implementation GREYAppStateTrackerTest

- (void)testLastKnownStateChangedAfterOnStateChange {
  // objc_precise_lifetime required so obj1 and obj2 are valid until end of the current scope.
  __attribute__((objc_precise_lifetime)) NSObject *obj1 = [[NSObject alloc] init];
  __attribute__((objc_precise_lifetime)) NSObject *obj2 = [[NSObject alloc] init];

  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj1],
                 @"Default state should be kGREYIdle");

  NSString *elementID1 = TRACK_STATE_FOR_ELEMENT(kGREYPendingCAAnimation, obj1);

  XCTAssertEqual(kGREYPendingCAAnimation,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj1],
                 @"State should be kGREYPendingCAAnimation");
  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj2],
                 @"Default state should be kGREYIdle");

  NSString *elementID2 = TRACK_STATE_FOR_ELEMENT(kGREYPendingDrawLayoutPass, obj2);

  XCTAssertEqual(kGREYPendingCAAnimation,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj1],
                 @"State should be kGREYPendingCAAnimation");
  XCTAssertEqual(kGREYPendingDrawLayoutPass,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj2],
                 @"State should be kGREYPendingDrawCycle");

  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingCAAnimation, elementID1);

  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj1],
                 @"State should be kGREYIdle");
  XCTAssertEqual(kGREYPendingDrawLayoutPass,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj2],
                 @"State should be kGREYPendingDrawCycle");

  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingDrawLayoutPass, elementID2);

  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj1],
                 @"State should be kGREYIdle");
  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj2],
                 @"State should be kGREYIdle");

}

- (void)testCurrentStateAfterOnStateChange {
  NSObject *obj1 = [[NSObject alloc] init];
  NSObject *obj2 = [[NSObject alloc] init];

  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] currentState],
                 @"By default current state should always be in kGREYIdle");

  NSString *elementID1 = TRACK_STATE_FOR_ELEMENT(kGREYPendingCAAnimation, obj1);

  XCTAssertEqual(kGREYPendingCAAnimation,
                 [[GREYAppStateTracker sharedInstance] currentState],
                 @"State should be kGREYPendingCAAnimation");

  NSString *elementID2 = TRACK_STATE_FOR_ELEMENT(kGREYPendingDrawLayoutPass, obj2);

  XCTAssertEqual(kGREYPendingCAAnimation | kGREYPendingDrawLayoutPass,
                 [[GREYAppStateTracker sharedInstance] currentState],
                 @"State should be kGREYPendingCAAnimation and kGREYPendingDrawCycle");

  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingCAAnimation, elementID1);

  XCTAssertEqual(kGREYPendingDrawLayoutPass,
                 [[GREYAppStateTracker sharedInstance] currentState],
                 @"State should be kGREYPendingDrawCycle");

  UNTRACK_STATE_FOR_ELEMENT_WITH_ID(kGREYPendingDrawLayoutPass, elementID2);

  XCTAssertEqual(kGREYIdle,
                 [[GREYAppStateTracker sharedInstance] currentState],
                 @"State should be kGREYIdle");
}

- (void)testDescriptionInVerboseMode {
  NSObject *obj1 = [[NSObject alloc] init];

  NSString *desc = [[GREYAppStateTracker sharedInstance] description];
  XCTAssertTrue([desc rangeOfString:@"Idle"].location != NSNotFound,
                 @"No state transition, should report Idle state in description");

  TRACK_STATE_FOR_ELEMENT(kGREYPendingCAAnimation, obj1);

  desc = [[GREYAppStateTracker sharedInstance] description];
  XCTAssertTrue([desc rangeOfString:@"Waiting for CAAnimations to finish"].location != NSNotFound,
                @"Should report that it is waiting on CAAnimation to finish");

  NSString *obj1ClassAndMemory = [NSString stringWithFormat:@"<%@:%p>", [obj1 class], obj1];
  NSString *obj1FullStateDesc = [NSString stringWithFormat:@"%@ => %@",
                                                           obj1ClassAndMemory,
                                                           @"Waiting for CAAnimations to finish"];
  XCTAssertTrue([desc rangeOfString:obj1FullStateDesc].location != NSNotFound,
                @"Should report exactly what object is in what state.");
}

- (void)testDeallocatedObjectClearsState {
  @autoreleasepool {
    __autoreleasing NSObject *obj = [[NSObject alloc] init];
    TRACK_STATE_FOR_ELEMENT(kGREYPendingUIWebViewAsyncRequest, obj);
    XCTAssertEqual(kGREYPendingUIWebViewAsyncRequest,
                   [[GREYAppStateTracker sharedInstance] grey_lastKnownStateForElement:obj]);
  }
  // obj should dealloc and clear all associations, causing state tracker to untrack all states
  // associated to it.
  XCTAssertEqual(kGREYIdle, [[GREYAppStateTracker sharedInstance] currentState]);
}

- (void)testAppStateEfficiency {
  CFTimeInterval testStartTime = CACurrentMediaTime();

  // Make a really big UIView hierarchy.
  UIView *view = [[UIView alloc] init];
  for (int i = 0; i < 15000; i++) {
    [view addSubview:[[UIView alloc] init]];
  }

  // With efficient state tracking, this test should complete in under .5 seconds. To avoid test
  // flakiness, just make sure that it is under 10 seconds.
  XCTAssertLessThan(CACurrentMediaTime() - testStartTime, 10,
                    @"This test should complete in less than than 10 seconds.");
}

@end
