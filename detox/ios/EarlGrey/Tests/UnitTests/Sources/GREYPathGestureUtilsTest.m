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

#import <EarlGrey/CGGeometry+GREYAdditions.h>
#import <EarlGrey/GREYPathGestureUtils.h>
#import <EarlGrey/GREYVisibilityChecker.h>
#import <OCMock/OCMock.h>

#import "GREYBaseTest.h"
#import "GREYExposedForTesting.h"

@interface GREYPathGestureUtilsTest : GREYBaseTest
@end

@implementation GREYPathGestureUtilsTest

- (void)setUp {
  [super setUp];
  [[[self.mockSharedApplication stub]
      andReturnValue:@(UIDeviceOrientationPortrait)] statusBarOrientation];
}

// Executes the given block once for each direction (up, down, left and right).
- (void)forEachDirectionPerformBlock:(void(^)(GREYDirection direction))block {
  GREYDirection allDirections[4] = {
    kGREYDirectionUp,
    kGREYDirectionDown,
    kGREYDirectionLeft,
    kGREYDirectionRight
  };
  const NSInteger maxDirections = (NSInteger)(sizeof(allDirections)/sizeof(allDirections[0]));
  for (NSInteger i = 0; i < maxDirections; i++) {
    block(allDirections[i]);
  }
}

// Returns a mock UIView that covers the entire screen.
- (id)mockFullScreenUIView {
  CGRect bounds = [UIScreen mainScreen].bounds;
  id mockUIView = [OCMockObject partialMockForObject:[[UIView alloc] initWithFrame:bounds]];
  id mockWindow = [OCMockObject partialMockForObject:[[UIWindow alloc] initWithFrame:bounds]];
  [[[mockWindow stub] andReturnValue:OCMOCK_VALUE(bounds)] convertRect:bounds
                                                            fromWindow:OCMOCK_ANY];
  [[[mockUIView stub] andReturn:mockWindow] window];
  [[[mockUIView stub] andReturnValue:OCMOCK_VALUE(bounds)] accessibilityFrame];
  return mockUIView;
}

- (void)testSwipeTouchPathBeginsWithGivenStartPoint {
  [self forEachDirectionPerformBlock:^(GREYDirection direction) {
    CGPoint startPoint = CGPointMake(100, 200);
    UIWindow *window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    NSArray *path = [GREYPathGestureUtils touchPathForGestureWithStartPoint:startPoint
                                                               andDirection:direction
                                                                   inWindow:window];
    CGPoint pathStartPoint = [path[0] CGPointValue];
    XCTAssertEqual(pathStartPoint.x, startPoint.x);
    XCTAssertEqual(pathStartPoint.y, startPoint.y);
  }];
}

- (void)testTouchPathIsNilForHiddenViews {
  [self forEachDirectionPerformBlock:^(GREYDirection direction) {
    UIView *view = [[UIView alloc] initWithFrame:CGRectZero];
    view.accessibilityFrame = CGRectZero;
    XCTAssertNil([GREYPathGestureUtils touchPathForGestureInView:view
                                                   withDirection:direction
                                                          length:100
                                              startPointPercents:GREYCGPointNull
                                              outRemainingAmount:NULL]);
  }];
}

- (void)testTouchPathCannotBegeneratedForZeroAmounts {
  [self forEachDirectionPerformBlock:^(GREYDirection direction) {
    UIView *view = [[UIView alloc] initWithFrame:CGRectZero];
    XCTAssertThrowsSpecificNamed([GREYPathGestureUtils touchPathForGestureInView:view
                                                                   withDirection:direction
                                                                          length:0
                                                              startPointPercents:GREYCGPointNull
                                                              outRemainingAmount:NULL],
                                 NSException,
                                 NSInternalInconsistencyException,
                                 @"Must throw exception because amount is 0.");
  }];
}

- (void)testTouchPathCannotBegeneratedForNegativeAmounts {
  [self forEachDirectionPerformBlock:^(GREYDirection direction) {
    UIView *view = [[UIView alloc] initWithFrame:CGRectZero];
    XCTAssertThrowsSpecificNamed([GREYPathGestureUtils touchPathForGestureInView:view
                                                                   withDirection:direction
                                                                          length:-1
                                                              startPointPercents:GREYCGPointNull
                                                              outRemainingAmount:NULL],
                                 NSException,
                                 NSInternalInconsistencyException,
                                 @"Must throw exception because amount is negative.");
  }];
}

- (void)testTouchPathBreaksPathsAccurately {
  // Create a mock visibility checker that presents entire screen to be visible.
  id mockVisibilityChecker = OCMClassMock([GREYVisibilityChecker class]);
  OCMStub([mockVisibilityChecker
      rectEnclosingVisibleAreaOfElement:OCMOCK_ANY]).andReturn([UIScreen mainScreen].bounds);

  [self forEachDirectionPerformBlock:^(GREYDirection direction) {
    id mockUIView = [self mockFullScreenUIView];
    // Attempt to create paths with any length greater than the width and height of the screen.
    const CGFloat totalExpectedPathAmount = 10000;
    CGFloat totalActualPathAmount = 0;
    CGFloat remainingAmount = totalExpectedPathAmount;
    NSUInteger pathSegmentsCount = 0;
    while (remainingAmount > 0) {
      NSArray *path = [GREYPathGestureUtils touchPathForGestureInView:mockUIView
                                                        withDirection:kGREYDirectionDown
                                                               length:remainingAmount
                                                   startPointPercents:GREYCGPointNull
                                                   outRemainingAmount:&remainingAmount];
      CGFloat pathLength = CGVectorLength(CGVectorFromEndPoints([[path firstObject] CGPointValue],
                                                                [[path lastObject] CGPointValue],
                                                                NO));
      pathSegmentsCount += 1;
      XCTAssertGreaterThan(pathLength, kGREYScrollDetectionLength,
                           @"Touch path length must be greater than the scroll detection length.");
      // NOTE: Touch path contains kGREYScrollDetectionLength length in addition to what is
      // required, we subtract that here to compute the effective touch path length.
      totalActualPathAmount += pathLength - kGREYScrollDetectionLength;
    }
    XCTAssertGreaterThanOrEqual(pathSegmentsCount, 2u,
                                @"Path must be broken into at least 2 segments.");
    XCTAssertEqualWithAccuracy(totalActualPathAmount, totalExpectedPathAmount, 0.000001f);
  }];
}

@end
