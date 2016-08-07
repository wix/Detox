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

#import <EarlGrey/GREYActions.h>
#import <EarlGrey/GREYConstants.h>
#import <EarlGrey/GREYElementMatcherBlock.h>
#import <EarlGrey/GREYMatchers.h>
#import <EarlGrey/NSObject+GREYAdditions.h>
#import <OCMock/OCMock.h>

#import "GREYBaseTest.h"

@interface GREYActionsTest : GREYBaseTest
@end

@implementation GREYActionsTest

- (void)testTapActionConstraintsFailed {
  UIView *view = [[UIView alloc] init];
  id<GREYAction> tap = [GREYActions actionForTap];
  @try {
    [tap perform:view error:nil];
    XCTFail(@"Should have thrown an assertion");
  } @catch (NSException *exception) {
    NSString *reason =
        [NSString stringWithFormat:@"Action could not be performed on element '%@' because it "
                                   @"failed constraints: interactable",
                                   [view grey_description]];
    XCTAssertEqualObjects(kGREYActionFailedException,
                          [exception name],
                          @"Should throw GREYActionFailException");
    XCTAssertEqualObjects(reason,
                          [exception reason],
                          @"Did we change the exception reason?");
  }
}

- (void)testTapActionConstraintsFailedWithNSError {
  UIView *view = [[UIView alloc] init];
  id<GREYAction> tap = [GREYActions actionForTap];
  NSError *error;
  [tap perform:view error:&error];
  NSString *reason =
      [NSString stringWithFormat:@"Action could not be performed on element '%@' because it "
                                 @"failed constraints: interactable",
                                 [view grey_description]];
  XCTAssertEqualObjects(kGREYInteractionErrorDomain, error.domain);
  XCTAssertEqual(kGREYInteractionActionFailedErrorCode, error.code);
  XCTAssertTrue([error.localizedDescription rangeOfString:reason].location != NSNotFound,
                @"Reason is:\n%@\nError Description:\n%@", reason, error.localizedDescription);
}

- (void)testMultiTapActionConstraintsFailed {
  UIView *view = [[UIView alloc] init];
  id<GREYAction> doubleTap = [GREYActions actionForMultipleTapsWithCount:2];
  @try {
    [doubleTap perform:view error:nil];
    XCTFail(@"Should have thrown an exception");
  } @catch (NSException *exception) {
    NSString *reason =
        [NSString stringWithFormat:@"Action could not be performed on element '%@' because it "
                                   @"failed constraints: interactable",
                                   [view grey_description]];
    XCTAssertEqualObjects(kGREYActionFailedException,
                          [exception name],
                          @"Should throw GREYActionFailException");
    XCTAssertEqualObjects(reason,
                          [exception reason],
                          @"Did we change the exception reason?");
  }
}

- (void)testMultiTapActionWithZeroTapCount {
  XCTAssertThrowsSpecificNamed([GREYActions actionForMultipleTapsWithCount:0],
                               NSException,
                               NSInternalInconsistencyException,
                               @"Should throw an exception for initializing a tap action with "
                               @" zero tap count.");
}

- (void)testTurnSwitchActionConstraintsFailed {
  UISwitch *uiswitch = [[UISwitch alloc] init];
  uiswitch.hidden = YES;
  id<GREYAction> turnSwitch = grey_turnSwitchOn(YES);
  @try {
    [turnSwitch perform:uiswitch error:nil];
    XCTFail(@"Should have thrown an assertion");
  } @catch (NSException *exception) {
    NSString *reason =
        [NSString stringWithFormat:@"Action could not be performed on element '%@' "
                                   @"because it failed constraints: interactable",
                                   [uiswitch grey_description]];
    XCTAssertEqualObjects(kGREYActionFailedException,
                          [exception name],
                          @"Should throw GREYActionFailException");
    XCTAssertEqualObjects(reason,
                          [exception reason],
                          @"Did we change the exception reason?");
  }
}

- (void)testSwipeLeftActionConstraintsFailed {
  UIView *view = [[UIView alloc] init];
  id<GREYAction> swipeLeft = [GREYActions actionForSwipeFastInDirection:kGREYDirectionLeft];
  @try {
    [swipeLeft perform:view error:nil];
    XCTFail(@"Should have thrown an assertion");
  } @catch (NSException *exception) {
    NSString *reason =
        [NSString stringWithFormat:@"Action could not be performed on element '%@' because it "
                                   @"failed constraints: interactable",
                                   [view grey_description]];
    XCTAssertEqualObjects(kGREYActionFailedException,
                          [exception name],
                          @"Should throw GREYActionFailException");
    XCTAssertEqualObjects(reason,
                          [exception reason],
                          @"Did we change the error reason?");
  }
}

- (void)testSwipeOnViewWithoutWindow {
  // First, disable other constraint checks so the action won't fail because of them
  [[GREYConfiguration sharedInstance] setValue:@NO
                                  forConfigKey:kGREYConfigKeyActionConstraintsEnabled];

  UIView *view = [[UIView alloc] init];
  [[[self.mockSharedApplication stub]
      andReturnValue:@(UIDeviceOrientationPortrait)] statusBarOrientation];
  id<GREYAction> swipeLeft = [GREYActions actionForSwipeFastInDirection:kGREYDirectionLeft];

  @try {
    [swipeLeft perform:view error:nil];
    XCTFail(@"Should have thrown an assertion");
  } @catch (NSException *exception) {
    NSString *expectedReason =
        [NSString stringWithFormat:@"Cannot swipe on view %@, as it has no window and it isn't a "
                                   @"window itself.", view];
    XCTAssertEqualObjects([exception name],
                          kGREYGenericFailureException,
                          @"Should throw GREYAssertionFailedException");
    XCTAssertEqualObjects([exception reason],
                          expectedReason,
                          @"Did we change the error reason?");
  }
}

- (void)testTapDisabledControl {
  UIControl *view = [[UIControl alloc] init];

  // Mock out [GREYMatchers matcherForSufficientlyVisible] for a matcher that matches anything.
  id mockMatcher = [OCMockObject mockForProtocol:@protocol(GREYMatcher)];
  OCMStub([mockMatcher matches:OCMOCK_ANY]).andReturn(@YES);
  id mockGREYMatchers = OCMClassMock([GREYMatchers class]);
  OCMStub([mockGREYMatchers matcherForSufficientlyVisible]).andReturn(mockMatcher);

  view.enabled = NO;
  id<GREYAction> tap = [GREYActions actionForTap];
  @try {
    [tap perform:view error:nil];
    XCTFail(@"Should have thrown an assertion");
  } @catch (NSException *exception) {
    NSString *reasonSubstring = @"because it failed constraints: enabled";
    XCTAssertEqualObjects(kGREYActionFailedException,
                          [exception name],
                          @"Should throw GREYActionFailException");
    XCTAssertTrue([[exception reason] rangeOfString:reasonSubstring].length > 0,
                  @"Did we change the error reason? Expected substring '%@', in '%@' not found",
                  reasonSubstring,
                  [exception reason]);
  }
}

- (void)testInvalidTapActionSucceedsAfterDisablingConstraints {
  [[GREYConfiguration sharedInstance] setValue:@NO
                                  forConfigKey:kGREYConfigKeyActionConstraintsEnabled];

  UIView *view = [[UIView alloc] init];
  id<GREYAction> tap = [GREYActions actionForTap];
  @try {
    [tap perform:view error:nil];
  }
  @catch (NSException *exception) {
    XCTFail(@"Action should succeed without constraint checks.");
  }
}

@end

