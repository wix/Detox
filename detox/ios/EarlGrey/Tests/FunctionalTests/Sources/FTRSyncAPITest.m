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

#import <EarlGrey/GREYExposed.h>
#import <EarlGrey/UIApplication+GREYAdditions.h>

#import "FTRBaseIntegrationTest.h"

@interface FTRSyncAPITest : FTRBaseIntegrationTest

@end

@implementation FTRSyncAPITest

- (void)setUp {
  [super setUp];
  [self openTestViewNamed:@"Basic Views"];
}

- (void)testPushAndPopRunLoopModes {
  XCTAssertNil([[UIApplication sharedApplication] grey_activeRunLoopMode]);
  [[UIApplication sharedApplication] pushRunLoopMode:@"Boo" requester:self];
  XCTAssertEqualObjects([[UIApplication sharedApplication] grey_activeRunLoopMode], @"Boo");
  [[UIApplication sharedApplication] pushRunLoopMode:@"Foo"];
  XCTAssertEqualObjects([[UIApplication sharedApplication] grey_activeRunLoopMode], @"Foo");
  [[UIApplication sharedApplication] popRunLoopMode:@"Foo"];
  XCTAssertEqualObjects([[UIApplication sharedApplication] grey_activeRunLoopMode], @"Boo");
  [[UIApplication sharedApplication] popRunLoopMode:@"Boo" requester:self];
  XCTAssertNotEqualObjects([[UIApplication sharedApplication] grey_activeRunLoopMode], @"Boo");
  XCTAssertNotEqualObjects([[UIApplication sharedApplication] grey_activeRunLoopMode], @"Foo");
}

- (void)testGREYExecuteSync {
  __block BOOL firstGREYExecuteSyncStarted = NO;
  __block BOOL secondGREYExecuteSyncStarted = NO;

  // Execute on a background thread.
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // To synchronize execution on background thread, grey_execute_sync must be called.
    grey_execute_sync(^{
      firstGREYExecuteSyncStarted = YES;
      [[EarlGrey selectElementWithMatcher:[GREYMatchers matcherForText:@"Tab 2"]]
          performAction:grey_tap()];
      id<GREYMatcher> matcher = grey_allOf(grey_kindOfClass([UITextField class]),
                                         grey_accessibilityLabel(@"Type Something Here"),
                                         nil);
      [[[EarlGrey selectElementWithMatcher:matcher] performAction:grey_tap()]
          performAction:grey_typeText(@"Hello!")];
    });
    grey_execute_sync(^{
      secondGREYExecuteSyncStarted = YES;
      id<GREYMatcher> matcher = grey_allOf(grey_kindOfClass([UITextField class]),
                                         grey_accessibilityLabel(@"Type Something Here"),
                                         nil);
      [[EarlGrey selectElementWithMatcher:matcher] assertWithMatcher:grey_text(@"Hello!")];
    });
  });

  // This should wait for the first grey_execute_sync to start execution on the background thread.
  BOOL success = [[GREYCondition conditionWithName:@"Wait for first grey_execute_sync"
                                             block:^BOOL{
    return firstGREYExecuteSyncStarted;
  }] waitWithTimeout:5.0];
  GREYAssert(success, @"Waiting for first grey_execute_sync to start timed-out");

  [[EarlGrey selectElementWithMatcher:grey_allOf(grey_kindOfClass([UITextField class]),
                                                 grey_accessibilityLabel(@"Type Something Here"),
                                                 nil)]
      assertWithMatcher:grey_text(@"Hello!")];

  // This should wait for the second grey_execute_sync to start execution on the background thread.
  success = [[GREYCondition conditionWithName:@"Wait for first grey_execute_sync"
                                        block:^BOOL{
    return secondGREYExecuteSyncStarted;
  }] waitWithTimeout:5.0];
  GREYAssert(success, @"Waiting for second grey_execute_sync to start timed-out");
}

- (void)testGREYExecuteAsyncOnMainThread {
  grey_execute_async(^{
    [[EarlGrey selectElementWithMatcher:[GREYMatchers matcherForText:@"Tab 2"]]
        performAction:grey_tap()];
    [[[EarlGrey selectElementWithMatcher:grey_allOf(grey_kindOfClass([UITextField class]),
                                                    grey_accessibilityLabel(@"Type Something Here"),
                                                    nil)]
        performAction:grey_tapAtPoint(CGPointMake(0, 0))]
        performAction:grey_typeText(@"Hello!")];
  });
  // This should wait for the above async task to finish.
  [[EarlGrey selectElementWithMatcher:grey_allOf(grey_kindOfClass([UITextField class]),
                                                 grey_accessibilityLabel(@"Type Something Here"),
                                                 nil)]
      assertWithMatcher:grey_text(@"Hello!")];
}

- (void)testGREYExecuteAsyncOnBackgroundThread {
  __block BOOL executeAsyncStarted = NO;

  // Execute on a background thread.
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    grey_execute_async(^{
      executeAsyncStarted = YES;
      [[EarlGrey selectElementWithMatcher:[GREYMatchers matcherForText:@"Tab 2"]]
          performAction:grey_tap()];
      id matcher = grey_allOf(grey_kindOfClass([UITextField class]),
                              grey_accessibilityLabel(@"Type Something Here"),
                              nil);
      [[[EarlGrey selectElementWithMatcher:matcher] performAction:grey_tap()]
          performAction:grey_typeText(@"Hello!")];
    });
  });
  // This should wait for grey_execute_async to start execution on the background thread.
  BOOL success = [[GREYCondition conditionWithName:@"Wait for background grey_execute_async"
                                             block:^BOOL{
    return executeAsyncStarted;
  }] waitWithTimeout:5.0];
  GREYAssert(success, @"Waiting for grey_execute_async to start timed-out");

  // This should wait for the above async to finish.
  [[EarlGrey selectElementWithMatcher:grey_allOf(grey_kindOfClass([UITextField class]),
                                                 grey_accessibilityLabel(@"Type Something Here"),
                                                 nil)]
      assertWithMatcher:grey_text(@"Hello!")];
}

@end
